const Tesseract = require("tesseract.js");

exports.readText = async (imageSource) => {
    const result = await Tesseract.recognize(
        imageSource,
        "eng"
    );
    return result.data.text;
};