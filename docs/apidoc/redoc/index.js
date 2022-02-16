/**
 * @param specUrl {string}
 */
function redocInit(specUrl, btnId) {
    let redocObj = document.querySelector("redoc");
    redocObj.remove();
    let redocElement = document.createElement("redoc");
    redocElement.id = "redoc";
    let mainElement = document.querySelector("div.main");
    mainElement.appendChild(redocElement);
    Redoc.init(specUrl, {
        scrollYOffset: 80
    }, document.getElementById("redoc"));
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