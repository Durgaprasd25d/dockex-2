const Tesseract = require("tesseract.js");

let workerInstance = null;

async function getWorker() {
    if (!workerInstance) {
        workerInstance = await Tesseract.createWorker("eng", 1, {
            logger: () => {},
            errorHandler: (err) => console.error("Tesseract worker error:", err)
        });
    }
    return workerInstance;
}

exports.readText = async (imageSource) => {
    try {
        const worker = await getWorker();
        const { data } = await worker.recognize(imageSource);
        return data.text;
    } catch (err) {
        console.warn("Worker recognize failed, falling back to direct recognize:", err.message);
        const { data } = await Tesseract.recognize(imageSource, "eng");
        return data.text;
    }
};