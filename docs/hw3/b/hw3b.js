/**
 * Created by kostya on 26.12.2016.
 */

function main() {
    var canvas = document.getElementById('my-canvas');
    bindWheelListener(canvas);
    var gl = canvas.getContext('webgl');
    var shaderProgram = initShaderProgram(gl, 'shaders/vertex.glsl', 'shaders/fragment.glsl');
    var rotator = new Rotator(canvas, draw, 3, 0.5, 4, 0, 180);

    var u_diffuseMap = gl.getUniformLocation(shaderProgram, "diffuseMap");
    var u_normalMap = gl.getUniformLocation(shaderProgram, "normalMap");
    var u_depthMap = gl.getUniformLocation(shaderProgram, "depthMap");

    var u_projection = gl.getUniformLocation(shaderProgram, "u_projection");
    var u_model = gl.getUniformLocation(shaderProgram, "u_model");
    var u_view = gl.getUniformLocation(shaderProgram, "u_view");

    var u_light = gl.getUniformLocation(shaderProgram, "u_light");
    var u_viewPos = gl.getUniformLocation(shaderProgram, "u_viewPos");

    var a_position = gl.getAttribLocation(shaderProgram, "a_position");
    var a_normal = gl.getAttribLocation(shaderProgram, "a_normal");
    var a_texCoord = gl.getAttribLocation(shaderProgram, "a_texCoord");
    var a_tangent = gl.getAttribLocation(shaderProgram, "a_tangent");
    var a_bitangent = gl.getAttribLocation(shaderProgram, "a_bitangent");

    var tx_diffuseMap = gl.createTexture();
    var tx_normalMap = gl.createTexture();
    var tx_depthMap = gl.createTexture();

    var projection = mat4.create();
    var view = mat4.create();
    var model = mat4.create();

    var light = [1.0,1.0,1.0];

    var imageUrls = [
        'textures/1.png',
        'textures/2.png',
        'textures/3.png'
    ];
    var images = [];
    var imageLoaded = false;
    var texturesCreated = false;

    loadImages(imageUrls);

    setInterval(draw, 1000);

    var poses = [];
    var norms = [];
    var coords = [];
    var tgs = [];
    var btgs = [];

    prepareVecs();

    console.log(poses);
    console.log(norms);
    console.log(coords);
    console.log(tgs);
    console.log(btgs);

    var posBuffer = gl.createBuffer();
    var normBuffer = gl.createBuffer();
    var coordBuffer = gl.createBuffer();
    var tgBuffer = gl.createBuffer();
    var btgBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(poses), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, tgBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tgs), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, btgBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(btgs), gl.STATIC_DRAW);


    function draw() {
        console.log('draw');
        if (!imageLoaded) {
            return;
        }
        if (!texturesCreated) {
            return;
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(shaderProgram);

        view = rotator.getViewMatrix();
        mat4.perspective(projection, Math.PI/4, canvas.width/canvas.height, 0.1, 100);

        gl.uniformMatrix4fv(u_projection, false, projection);
        gl.uniformMatrix4fv(u_view, false, view);

        model = mat4.create();
        gl.uniformMatrix4fv(u_model, false, model);
        gl.uniform3fv(u_viewPos, rotator.getPosition());
        gl.uniform3fv(u_light, light);

        gl.uniform1i(u_diffuseMap, 0);
        gl.uniform1i(u_normalMap, 1);
        gl.uniform1i(u_depthMap, 2);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tx_diffuseMap);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tx_normalMap);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tx_depthMap);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_position);

        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_normal);

        gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);

        gl.bindBuffer(gl.ARRAY_BUFFER, tgBuffer);
        gl.vertexAttribPointer(a_tangent, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_tangent);

        gl.bindBuffer(gl.ARRAY_BUFFER, btgBuffer);
        gl.vertexAttribPointer(a_bitangent, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_bitangent);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    function loadImages(urls) {
        console.log('loadImages');
        var imagesToLoad = urls.length;
        var onImageLoad = function() {
            --imagesToLoad;
            console.log(imagesToLoad);
            if (imagesToLoad == 0) {
                imageLoaded = true;
                createTextures();
            }
        };

        for (var ii = 0; ii < imagesToLoad; ++ii) {
            var image = loadImage(urls[ii], onImageLoad);
            images.push(image);
        }
    }

    function loadImage(url, callback) {
        var image = new Image();
        image.src = url;
        image.onload = callback;
        return image;
    }

    function createTextures() {
        console.log('createTextures');
        gl.bindTexture(gl.TEXTURE_2D, tx_diffuseMap);
        setTextureParameters(images[0]);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(gl.TEXTURE_2D, tx_normalMap);
        setTextureParameters(images[1]);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindTexture(gl.TEXTURE_2D, tx_depthMap);
        setTextureParameters(images[2]);
        gl.bindTexture(gl.TEXTURE_2D, null);

        texturesCreated = true;
    }

    function setTextureParameters(image) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    function prepareVecs() {
        var pos1 = vec3.fromValues(-1.0, 1.0, 0.0);
        var pos2 = vec3.fromValues(-1.0, -1.0, 0.0);
        var pos3 = vec3.fromValues(1.0, -1.0, 0.0);
        var pos4 = vec3.fromValues(1.0, 1.0, 0.0);

        var uv1 = vec2.fromValues(0.0, 1.0);
        var uv2 = vec2.fromValues(0.0, 0.0);
        var uv3 = vec2.fromValues(1.0, 0.0);
        var uv4 = vec2.fromValues(1.0, 1.0);

        var nm = vec3.fromValues(0.0, 0.0, 1.0);

        var tangent1 = vec3.create();
        var bitangent1 = vec3.create();
        var tangent2 = vec3.create();
        var bitangent2 = vec3.create();

        var edge1 = vec3.create();
        vec3.subtract(edge1, pos2, pos1);

        var edge2 = vec3.create();
        vec3.subtract(edge2, pos3, pos1);

        var deltaUV1 = vec2.create();
        vec2.subtract(deltaUV1, uv2, uv1);

        var deltaUV2 = vec2.create();
        vec2.subtract(deltaUV2, uv3, uv1);

        var f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

        tangent1[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
        tangent1[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
        tangent1[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
        vec3.normalize(tangent1, tangent1);

        bitangent1[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
        bitangent1[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
        bitangent1[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
        vec3.normalize(bitangent1, bitangent1);

        vec3.subtract(edge1, pos3, pos1);
        vec3.subtract(edge2, pos4, pos1);
        vec2.subtract(deltaUV1, uv3, uv1);
        vec2.subtract(deltaUV2, uv4, uv1);

        f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

        tangent2[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
        tangent2[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
        tangent2[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
        vec3.normalize(tangent2, tangent2);

        bitangent2[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
        bitangent2[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
        bitangent2[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
        vec3.normalize(bitangent2, bitangent2);

        poses = [
            pos1[0], pos1[1], pos1[2],
            pos2[0], pos2[1], pos2[2],
            pos3[0], pos3[1], pos3[2],

            pos1[0], pos1[1], pos1[2],
            pos3[0], pos3[1], pos3[2],
            pos4[0], pos4[1], pos4[2]
        ];

        norms = [
            nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2],

            nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2]
        ];

        coords = [
            uv1[0], uv1[1],
            uv2[0], uv2[1],
            uv3[0], uv3[1],

            uv1[0], uv1[1],
            uv3[0], uv3[1],
            uv4[0], uv4[1]
        ];

        tgs = [
            tangent1[0], tangent1[1], tangent1[2],
            tangent1[0], tangent1[1], tangent1[2],
            tangent1[0], tangent1[1], tangent1[2],

            tangent2[0], tangent2[1], tangent2[2],
            tangent2[0], tangent2[1], tangent2[2],
            tangent2[0], tangent2[1], tangent2[2]
        ];

        btgs = [
            bitangent1[0], bitangent1[1], bitangent1[2],
            bitangent1[0], bitangent1[1], bitangent1[2],
            bitangent1[0], bitangent1[1], bitangent1[2],

            bitangent2[0], bitangent2[1], bitangent2[2],
            bitangent2[0], bitangent2[1], bitangent2[2],
            bitangent2[0], bitangent2[1], bitangent2[2]
        ];
    }

    function bindWheelListener(elem) {
        if (elem.addEventListener) {
            if ('onwheel' in document) {
                elem.addEventListener("wheel", onWheel);
            } else if ('onmousewheel' in document) {
                elem.addEventListener("mousewheel", onWheel);
            } else {
                elem.addEventListener("MozMousePixelScroll", onWheel);
            }
        } else {
            elem.attachEvent("onmousewheel", onWheel);
        }

        function onWheel(e) {
            e = e || window.event;
            var delta = e.deltaY || e.detail || e.wheelDelta;
            rotator.setViewDistance(rotator.getViewDistance() + delta/200);
        }
    }

}