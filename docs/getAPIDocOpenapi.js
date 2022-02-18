const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const beautify_html = require('js-beautify').html;
const resourceList = require('./assets/FHIR/fhir.resourceList.json');
const API_DOC_OUT_DIR = "docs/apidoc/redoc";
function getExistResources() {
    return new Promise((resolve, reject) => {
        let existResources = [];
        for (let resourceListIndex = 0 ; resourceListIndex < resourceList.length; resourceListIndex++) { 
            let resourceType = resourceList[resourceListIndex];
            let apiFilePath = path.resolve(__dirname, `./apidoc/apidoc-sources/${resourceType}`);
            fs.stat(apiFilePath, function(err, stat){
                if (!err) {
                    existResources.push({
                        resourceType: resourceType,
                        path: apiFilePath
                    });
                }
                if (resourceListIndex == resourceList.length - 1) resolve(existResources);
            });
        }
    })

}

async function generateReDocHtml() {
    let existResources = await getExistResources();
    let htmlStr = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Burni FHIR API Document</title>
    <link href="index.css" rel="stylesheet">
</head>
<body>
    <div class="main mt-3">
    <div class="text-center mb-5">
        <div class="card-header">
            Resources
        </div>
        <div>
            <i class="filter-clear" id="filter-clear">×</i>
            <svg class="filter-search-icon search-icon" version="1.1" viewBox="0 0 1000 1000" x="0px" xmlns="http://www.w3.org/2000/svg" y="0px"><path d="M968.2,849.4L667.3,549c83.9-136.5,66.7-317.4-51.7-435.6C477.1-25,252.5-25,113.9,113.4c-138.5,138.3-138.5,362.6,0,501C219.2,730.1,413.2,743,547.6,666.5l301.9,301.4c43.6,43.6,76.9,14.9,104.2-12.4C981,928.3,1011.8,893,968.2,849.4z M524.5,522c-88.9,88.7-233,88.7-321.8,0c-88.9-88.7-88.9-232.6,0-321.3c88.9-88.7,233-88.7,321.8,0C613.4,289.4,613.4,433.3,524.5,522z"></path></svg>
            <input class="filter-input" type="text" placeholder="resource name" id="resource-filter" oninput="filterResourcesBtn(this.id)">
        </div>
        <div class="card-body">
        ${(()=> {
            let resourcesBtnHtml = "";
            for(let resource of existResources) {
                let btnId = `btn-${resource.resourceType.toLowerCase()}`;
                resourcesBtnHtml += `<button class="btn btn-outline-secondary mt-2 mb-2" id="${btnId}" onclick="redocInit('${resource.resourceType}/swagger.json', '${btnId}')">${resource.resourceType}</button>\r\n        `;
            }
            return resourcesBtnHtml;
        })()}
        </div>
    </div>
    <div id="redoc-container"></div>
    </div>
</body>
</html>
<script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0-rc.63/bundles/redoc.standalone.min.js"> </script>
<script src="https://cdn.jsdelivr.net/gh/wll8/redoc-try@1.4.0/dist/try.js"></script>
<script src="index.js"></script>
    `;
    let outPath = path.join(__dirname, "apidoc/redoc/index.html");
    fs.writeFileSync(outPath, beautify_html(htmlStr));
}

async function generateOpenAPIJsonFiles() {
    let existResources = await getExistResources();
    for(let resource of existResources) {
        exec(`apidoc-swagger -i ${resource.path} -o ${API_DOC_OUT_DIR}/${resource.resourceType} --openapi-version 3`, function(err, stdout, stderr) {
            if (err | stderr) {
                let error = err | stderr;
                throw error;
            }
            console.log(`successfully create ${resource.resourceType} openapi json`);
        });
    }
}
generateOpenAPIJsonFiles();
generateReDocHtml();