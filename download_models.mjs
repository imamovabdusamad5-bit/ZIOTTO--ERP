import fs from 'fs';
import path from 'path';
import https from 'https';

const modelsDir = path.join(process.cwd(), 'public', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model.weights.bin',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.weights.bin',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.weights.bin'
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                 https.get(response.headers.location, (redirectResponse) => {
                     redirectResponse.pipe(file);
                     file.on('finish', () => { file.close(resolve); });
                 }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => { file.close(resolve); });
            } else {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function downloadModels() {
    for (const file of files) {
        console.log(`Downloading ${file}...`);
        try {
            await download(baseUrl + file, path.join(modelsDir, file));
            console.log(`Successfully downloaded ${file}`);
        } catch (error) {
            console.error(`Error downloading ${file}:`, error);
        }
    }
    console.log("All downloads complete!");
}

downloadModels();
