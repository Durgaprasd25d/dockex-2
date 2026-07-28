const Tesseract = require("tesseract.js");

exports.readText = async (imageSource) => {
    const { data } = await Tesseract.recognize(imageSource, "eng", {
        cachePath: "/tmp"
    });
    return data.text;
};