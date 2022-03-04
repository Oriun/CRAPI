const fs = require('fs/promises')

function chunks(table, size) {
    return Array.from({ length: Math.ceil(table.length / size) }).map((_, i) => table.slice(size * i, size * (i + 1)))
}

function distance(x, y, ax, ay) {
    return Math.sqrt((ax - x) ** 2 + (ay - y) ** 2)
}

function linear_interpolation(data, up_factor_x = 16, up_factor_y = 16) {
    const up_length = Math.floor(data.length * data[0].length * up_factor_x * up_factor_y)
    const max_distance = Math.sqrt(up_factor_x ** 2 + up_factor_x ** 2)
    const arr_Up = new Array(up_length).fill(0)
    const y = up_factor_y
    const x = up_factor_x
    for (let i = 0; i < up_length; i++) {
        const i2 = data[0].length * up_factor_x
        const w = Math.floor(i / i2)
        const j = i % i2

        if (undefined == (data[Math.floor(w / up_factor_y)] ?? data[Math.floor(w / up_factor_y) - y] ?? data[Math.floor(w / up_factor_y) - y - 1])) {
            console.log('A', i, Math.floor(w / up_factor_y), Math.floor(w / up_factor_y) - y, Math.floor(w / up_factor_y) - y - 1)
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
        arr_Up[i] = Number.isNaN(value) ? 0 : Math.floor(value)
    }
    return arr_Up
}

function log_matrix(mat) {
    console.log('---------------------')
    for (const m of mat) {
        console.log(m.map(a => a.toString(16).padStart(2, "0")).join(''))
    }
    console.log('---------------------')
}

function log_as_matrix(width, height, mat) {
    for (let i = 0; i < height; i++) {
        let s = ''
        for (let j = 0; j < width; j++) {
            let k = mat[(i * width) + j]
            s += k.toString(16).padStart(2, "0")
        }
        console.log(s)
    }
}

function crop(matrix) {
    try {
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
    } catch (e) {
        return null
    }
}

function contrast(matrix, contrast_factor = 1, brightness = 0) {
    let translation = x => Math.floor(Math.max(0, Math.min(contrast_factor * (x - 128) + 128 + brightness)));
    return matrix.map(a => a.map(translation))
}

function cut(matrix, ratio = 4) {
    let translation = x => (x < 256 / ratio) ? 0 : 255;
    return matrix.map(a => a.map(translation))
}

async function process_image(image, to, config, print) {
    // const char = image.slice(2, 3)
    // console.log(char, '.')

    let img = image.slice(32, 2048)
    let matrix = []
    for (const byte of img) {
        const binary = byte.charCodeAt(0).toString(2).padStart(8, "0")
        const pixels = chunks(binary, 4).map(a => parseInt(a, 2) * 16)
        // console.log(binary, pixels)
        matrix.push(...pixels)
    }
    matrix = chunks(matrix, 64)
    const contrasted_matrix = contrast(matrix, config.contrast, config.brightness)
    const cut_matrix = cut(contrasted_matrix, config.cut)
    // log_matrix(matrix)
    const cropped = crop(cut_matrix)

    if (!cropped) return false

    try {
        const reduced_matrix = chunks(linear_interpolation(cropped, 28 / cropped[0].length, 28 / cropped.length), 28)
        print && log_matrix(reduced_matrix)
        const to_write = reduced_matrix.flatMap(a => a.map(b => String.fromCharCode(b))).join('')
        await fs.writeFile(to, new Array(128).fill('0').join('') + to_write, 'binary')
        console.log('Written', to_write.length)
        return true
    } catch (err) {
        console.error(err)
        console.log(cropped.length, cropped[0]?.length)
        return false
    }
}

const configs = require('./jp_configs.json')
/*
{
    ETL1: {
        transform: {
            cut: 3,
            contrast: 1,
            brightness: 16,
        },
        ETL1C_01: {
            mapping: {
                '0 ': "0",
                '1 ': "1",
                '2 ': "2",
                '3 ': "3",
                '4 ': "4",
                '5 ': "5",
                '6 ': "6",
                '7 ': "7",
            }
        },
        ETL1C_02: {
            mapping: {
                '8 ': "8",
                '9 ': "9",
                'A ': "A",
                'B ': "B",
                'C ': "C",
                'D ': "D",
                'E ': "E",
                'F ': "F",
            }
        },
        ETL1C_03: {
            mapping: {
                'G ': "G",
                'H ': "H",
                'I ': "I",
                'J ': "J",
                'K ': "K",
                'L ': "L",
                'M ': "M",
                'N ': "N",
            }
        },
        ETL1C_07: {
            mapping: {
                ' A': 'ア',
                ' I': 'イ',
                ' U': 'ウ',
                ' E': 'エ',
                ' O': 'オ',
                'KA': 'カ',
                'KI': 'キ',
                'KU': 'ク',
            }
        },
        ETL1C_08: {
            mapping: {
                'KE': 'ケ',
                'KO': 'コ',
                'SA': 'サ',
                'SI': 'シ',
                'SU': 'ス',
                'SE': 'セ',
                'SO': 'ソ',
                'TA': 'タ',
            }
        },
        ETL1C_09: {
            mapping: {
                'TI': 'チ',
                'TU': 'ツ',
                'TE': 'テ',
                'TO': 'ト',
                'NA': 'ナ',
                'NI': 'ニ',
                'NU': 'ヌ',
                'NE': 'ネ',
            }
        },
        ETL1C_10: {
            mapping: {
                'NO': 'ノ',
                'HA': 'ハ',
                'HI': 'ヒ',
                'HU': 'フ',
                'HE': 'ヘ',
                'HO': 'ホ',
                'MA': 'マ',
                'MI': 'ミ',
            }
        },
        ETL1C_11: {
            mapping: {
                'MU': 'ム',
                'ME': 'メ',
                'MO': 'モ',
                'YA': 'ヤ',
                // ' I': '',
                'YU': 'ユ',
                // ' E': '',
                'YO': 'ヨ',
            }
        },
        ETL1C_12: {
            mapping: {
                'RA': 'ラ',
                'RI': 'リ',
                'RU': 'ル',
                'RE': 'レ',
                'RO': 'ロ',
                'WA': 'ワ',
                'WI': 'ヰ',
                // ' U': '',
            }
        },
        ETL1C_13: {
            mapping: {
                'WE': 'ヱ',
                'WO': 'ヲ',
                'N': 'ン',
            }
        },
    },
    ETL7: {
        transform: {
            cut: 2,
            contrast: 1,
            brightness: 0,
        },
        ETL7LC_1: {
            mapping: {
                ' A': 'あ',
                ' I': 'い',
                ' U': 'う',
                ' E': 'え',
                ' O': 'お',
                'KA': 'か',
                'KI': 'き',
                'KU': 'く',
                'KE': 'け',
                'KO': 'こ',
                'SA': 'さ',
                'SI': 'し',
                'SU': 'す',
                'SE': 'せ',
                'SO': 'そ',
                'TA': 'た',
                'TI': 'ち',
                'TU': 'つ',
                'TE': 'て',
                'TO': 'と',
                'NA': 'な',
                'NI': 'に',
                'NU': 'ぬ',
                'NE': 'ね',
                'NO': 'の',
                'HA': 'は',
                'HI': 'ひ',
                'HU': 'ふ',
                'HE': 'へ',
                'HO': 'ほ',
                'MA': 'ま',
                'MI': 'み',
                'MU': 'む',
                'ME': 'め',
                'MO': 'も',
                'YA': 'や',
                'YU': 'ゆ',
                'YO': 'よ',
                'RA': 'ら',
                'RI': 'り',
                'RU': 'る',
                'RE': 'れ',
                'RO': 'ろ',
                'WA': 'わ',
                'WO': 'を',
                ' N': 'ん',
                // ',,': '゛',
                // ',0': '゜'
            }
        }
    }
}
*/

async function main() {
    const indexes = {}
    // const chars = new Set()
    for (const dataset in configs) {
        for (const filename in configs[dataset]) {
            if (filename === "transform") continue
            const file = await fs.readFile(`./ETL/${dataset}/${filename}`, 'binary')
            const images = chunks(file, 2052)

            for await (const img of images) {
                let char = img.slice(2, 4)
                // chars.add(char)
                char = configs[dataset][filename].mapping[char]
                if (char === undefined) {
                    console.log(char, img.slice(2, 4))
                    continue
                }
                indexes[char] ||= 0
                console.log(indexes[char])
                await fs.mkdir('./ETL_DATA/' + char, { recursive: true })
                const written = await process_image(img, './ETL_DATA/' + char + '/' + indexes[char] + ".npy", configs[dataset], false)
                // console.log(written)
                written && indexes[char]++
                // await new Promise(r => setTimeout(r, 2_000))
            }

        }
    }
    // console.log([...chars])
    console.log(indexes)
    console.log(Object.values(indexes))
    console.log(Object.keys(indexes))
}

main()
// console.log(Object.values(configs.ETL7.ETL7LC_1.mapping))