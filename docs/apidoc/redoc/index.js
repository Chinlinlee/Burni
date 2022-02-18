/**
 * @param specUrl {string}
 */
 function redocInit(specUrl, btnId) {
    let redocObj = document.getElementById("redoc-container");
    redocObj.remove();
    let redocElement = document.createElement("redoc-container");
    redocElement.id = "redoc-container";
    let mainElement = document.querySelector("div.main");
    mainElement.appendChild(redocElement);
    initTry({
        openApi: specUrl
    });
    let btn = document.getElementById(btnId);
    const btnList = document.querySelectorAll("button.btn");
    btnList.forEach((element, index , parent) => {
        element.classList.remove("btn-outline-secondary");
        element.classList.add("btn-outline-secondary");
        element.classList.remove("btn-secondary");
        if (index == btnList.length - 1) {
            btn.classList.add("btn-secondary");
            btn.classList.remove("btn-outline-secondary");
        }
    });
}

function filterResourcesBtn(id) {
    let input = document.getElementById(id);
    let qs = input.value.toLowerCase();
    let filterClearBtn = document.getElementById("filter-clear");
    if (!qs) filterClearBtn.style.display = "none";
    else filterClearBtn.style.display = "inline-block";
    let btnList = document.querySelectorAll(`[id*=btn-]`);
    btnList.forEach((element, key, parent) => {
        if (!qs) element.style.display = "inline-block";
        if (!element.id.includes(qs)) {
            element.style.display = "none";
        } else {
            element.style.display = "inline-block";
        }
    });
}

function init() {
    let filterClearBtn = document.getElementById("filter-clear");
    filterClearBtn.style.display = "none";
    filterClearBtn.onclick = function() {
        let input = document.getElementById("resource-filter");
        input.value = "";
        filterResourcesBtn("resource-filter");
    }
}

init();