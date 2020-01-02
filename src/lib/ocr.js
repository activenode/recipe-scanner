import config from '../config/reciperc';

const { ocrSpaceApiKey, language } = config;

export function ocrByBase64Image({ 
    isIngredient = false,
    dataURL,
}) {
    const formData = new FormData();
    formData.append('language', language);
    formData.append('apikey', ocrSpaceApiKey);
    formData.append('base64Image', dataURL);
    formData.append('isTable', isIngredient);

    fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        body: formData
    })
    .then((response) => response.json())
    .then(jsonResult => {
        console.log('sis is se result', jsonResult);
    });
}