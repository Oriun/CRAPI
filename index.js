const { spawn } = require('child_process')

function wait(t) {
    return new Promise(r => setTimeout(r, t))
}

// let KNN = spawn('./jp_knn', [12]);
let KNN = spawn('./knn', [12]);

KNN.stdout.on('data', (data) => console.log(data.toString()))
KNN.stderr.on('data', (data) => console.log(data.toString()))

KNN.on('close', () => console.log('Closed'))


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express()
const port = 3000

function log_as_matrix(width, height, mat) {
    for (let i = 0; i < height; i++) {
        let s = ''
        for (let j = 0; j < width; j++) {
            s += mat[(i * width) + j]
        }
        console.log(s)
    }
}

app.use(bodyParser())
app.use(cors())

app.post('/', async (req, res) => {
    log_as_matrix(req.body.image)
    const prediction = await new Promise(r => {
        KNN.stdout.once('data', data => {
            r(data.toString())
        })
        KNN.stdin.write(req.body.image + '\n')
    })
    res.json({ result: prediction[9] })
})

app.use(express.static('public'));

app.listen(port, "0.0.0.0", () => {
    console.log(`Example app listening on port ${port}`)
})
