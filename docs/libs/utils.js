/**
 * Created by kostya on 13.11.2016.
 */
function getXmlHttp(){
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
        xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
}

function getFileContent(path) {
    var xmlhttp = getXmlHttp();
    xmlhttp.open('GET', path, false);
    xmlhttp.send(null);
    if(xmlhttp.status == 200) {
        return xmlhttp.responseText;
    }
}

function initShaderProgram(gl, vertexShaderPath, fragmentShaderPath) {
    var vertexShaderCode = getFileContent(vertexShaderPath);
    var fragmentShaderCode = getFileContent(fragmentShaderPath);

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);

    console.log(gl.getShaderInfoLog(fragmentShader));
    console.log(gl.getShaderInfoLog(vertexShader));

    var shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    console.log(gl.getProgramInfoLog(shaderProgram));

    return shaderProgram;
}