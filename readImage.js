const fs = require('fs/promises')

function log_as_matrix(width, height, mat) {
    for (let i = 0; i < height; i++) {
        let s = ''
        for (let j = 0; j < width; j++) {
            s += mat[(i * width) + j]
        }
        console.log(s)
    }
}
function log_matrix(mat) {
    console.log('---------------------')
    for (const m of mat) {
        console.log(m.map(a => a.toString(16).padStart(2, "0")).join(''))
    }
    console.log('---------------------')
}
function str_to_matrix(width, height, mat, transform = a => a) {
    const res = []
    for (let i = 0; i < height; i++) {
        let s = []
        for (let j = 0; j < width; j++) {
            s.push(transform(mat[(i * width) + j]))
        }
        res.push(s)
    }
    return res
}


function resize(matrix) {
    let y_factor = matrix.length / 28
    let x_factor = matrix[0].length / 28
    let blank = Array.from({ length: 28 }).map(_ => Array.from({ length: 28 }))
    for (let i = 0; i < 28; i++)
        for (let j = 0; j < 28; j++) {
            let sum = 0;
            for (let k = 0; k < y_factor; k++) {
                for (let l = 0; l < x_factor; l++) {
                    sum += matrix[i * y_factor + k][j * x_factor + l];
                }
            }
            blank[i][j] = Math.floor(sum / (x_factor * y_factor));
        }
    return blank;
}
function pad(matrix, width, height, filler = 0) {
    //  matrix[height][width]
    const actual_height = matrix.length
    const actual_width = matrix[0].length

    const height_offset = (height - actual_height) / 2
    const width_offset = (width - actual_width) / 2

    matrix.splice(0, 0,
        ...Array
            .from({ length: Math.floor(height_offset) })
            .map(_ => new Array(actual_width).fill(filler))
    )
    matrix.splice(matrix.lengt - 1, 0,
        ...Array
            .from({ length: Math.ceil(height_offset) })
            .map(_ => new Array(actual_width).fill(filler))
    )
    matrix.forEach(m => {
        m.splice(0, 0, ...new Array(Math.ceil(width_offset)).fill(filler))
        m.splice(m.length - 1, 0, ...new Array(Math.floor(width_offset)).fill(filler))
    })

    return matrix
}
function crop(matrix) {
    while (matrix[0].every(z => z == 0)) {
        matrix.splice(0, 1)
    }
    while (matrix.at(-1).every(z => z == 0)) {
        matrix.splice(matrix.length - 1, 1)
    }
    while (matrix.every(m => m[0] == 0)) {
        matrix.forEach(a => a.splice(0, 1))
    }
    while (matrix.every(m => m.at(-1) == 0)) {
        matrix.forEach(a => a.splice(a.length - 1, 1))
    }
    return matrix
}

function distance(x, y, ax, ay) {
    return Math.sqrt((ax - x) ** 2 + (ay - y) ** 2)
}
function linear_interpolation(data, up_factor_x = 16, up_factor_y = 16) {
    const up_length = Math.ceil(data.length * data[0].length * up_factor_x * up_factor_y)
    const max_distance = Math.sqrt(up_factor_x ** 2 + up_factor_x ** 2)
    const arr_Up = new Array(up_length).fill(0)
    const y = up_factor_y
    const x = up_factor_x
    for (let i = 0; i < up_length; i++) {
        const i2 = data[0].length * up_factor_x
        const w = Math.floor(i / i2)
        const j = i % i2

        if(undefined == (data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])){
            console.log('A',i, Math.floor(w / up_factor_y), Math.floor(w / up_factor_y) - y, Math.floor(w / up_factor_y) - y - 1)
            console.log(data.length, data[0].length, data.length * data[0].length * up_factor_x * up_factor_y, up_length, up_factor_x, up_factor_y)
        }
        const points = [
            {
                x: Math.floor(j / up_factor_x) * up_factor_x,
                y: Math.floor(w / up_factor_y) * up_factor_y,
                value: (data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.floor(j / up_factor_x)] ??
                    (data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.floor(j / up_factor_x) - x - 1]
            },
            {
                x: Math.ceil(j / up_factor_x) * up_factor_x,
                y: Math.floor(w / up_factor_y) * up_factor_y,
                value: (data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.ceil(j / up_factor_x)] ??
                    (data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - x - 1])[Math.ceil(j / up_factor_x) - x - 1]
            },
            {
                x: Math.floor(j / up_factor_x) * up_factor_x,
                y: Math.ceil(w / up_factor_y) * up_factor_y,
                value: (data[Math.ceil(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.floor(j / up_factor_x)] ??
                (data[Math.ceil(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.floor(j / up_factor_x) - x - 1]
            },
            {
                x: Math.ceil(j / up_factor_x) * up_factor_x,
                y: Math.ceil(w / up_factor_y) * up_factor_y,
                value: (data[Math.ceil(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y)] ?? data[Math.ceil(w / up_factor_y) - y - 1] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.ceil(j / up_factor_x)] ??
                    (data[Math.ceil(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y)] ?? data[Math.ceil(w / up_factor_y) - y - 1] ?? data[Math.floor(w / up_factor_y) - y - 1])[Math.ceil(j / up_factor_x) - x - 1]
            },
        ]
        points.forEach(a => a.coeff = max_distance - distance(j, w, a.x, a.y))

        const total_coeffs = points.reduce((acc, cur) => acc + cur.coeff, 0)
        const value = points.reduce((acc, cur) => acc + (cur.value * cur.coeff), 0) / total_coeffs
        arr_Up[i] = Math.floor(value)
    }
    return arr_Up
}

async function process_image(from, to, display=false) {
    console.log('Processing', from)
    const file = await fs.readFile(from, 'binary')
    const data = file.slice(128)
    let image = crop(str_to_matrix(28, 28, data, a => a.charCodeAt(0)))
    console.log(from)
    console.log( 'ratio', 28 / image[0].length, 28 / image.length, image[0].length, image.length)
    try{
        image = linear_interpolation(image, 28 / image[0].length, 28 / image.length)
    }catch(e){
        log_matrix(image)
        throw e
    }
    const to_write = image.map(a => String.fromCharCode(a)).join('')

    await fs.writeFile(to, file.slice(0, 128) + to_write, 'binary')
    console.log('Written', to_write.length)
}
const dataset = {
    train: [5923, 6742, 5958, 6131, 5842, 5421, 5918, 6265, 5851, 5949],
    test: [980, 1135, 1032, 1010, 982, 892, 958, 1028, 974, 1009]
}
async function main() {
    for await (const set of Object.keys(dataset)) {
        for await (const label of Object.keys(dataset[set])) {
            for (let i = 0; i < dataset[set][label]; i++) {
                await fs.mkdir(`./normalized_data/${set}/${label}/`, { recursive: true }).catch(console.error)
                await process_image(`./standardized_data/${set}/${label}/${i}.npy`, `./normalized_data/${set}/${label}/${i}.npy`)
            }
        }
    }
}

main()