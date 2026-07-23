const Tesseract = require("tesseract.js");

exports.readText = async (path) => {

    const result = await Tesseract.recognize(

        path,

        "eng"

    );

    return result.data.text;

}