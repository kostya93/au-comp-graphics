/**
 * Created by kostya on 27.12.2016.
 */

function main() {
    var CANVAS_SIZE = 512;
    var SKYBOX_SIZE = 100;
    var canvas = document.getElementById('my-canvas');
    var gl = canvas.getContext('webgl');

    var skybox = {};
    skybox.program = initShaderProgram(gl, 'shaders/vertex_skybox.glsl', 'shaders/fragment_skybox.glsl');
    skybox.u_projection = gl.getUniformLocation(skybox.program, "projection");
    skybox.u_modelview = gl.getUniformLocation(skybox.program, "modelview");
    skybox.a_position = gl.getAttribLocation(skybox.program, "position");
    skybox.model = createModelSkybox(makeCube(SKYBOX_SIZE));

    var reflect_obj = {};
    reflect_obj.program = initShaderProgram(gl, 'shaders/vertex_obj.glsl', 'shaders/fragment_obj.glsl');
    reflect_obj.u_projection = gl.getUniformLocation(reflect_obj.program, "projection");
    reflect_obj.u_modelview = gl.getUniformLocation(reflect_obj.program, "modelview");
    reflect_obj.u_normalMatrix = gl.getUniformLocation(reflect_obj.program, "normalMatrix");
    reflect_obj.u_inverseViewTransform = gl.getUniformLocation(reflect_obj.program, "inverseViewTransform");
    reflect_obj.a_position = gl.getAttribLocation(reflect_obj.program, "a_position");
    reflect_obj.a_normal= gl.getAttribLocation(reflect_obj.program, "a_normal");
    reflect_obj.model = createModelReflectObj(loadObjModel('models/bunny_with_normals.obj'));
    reflect_obj.cube_map = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflect_obj.cube_map);

    var texture_consts = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    var kk;
    for (kk = 0; kk < 6; kk++) {
        gl.texImage2D(texture_consts[kk], 0, gl.RGBA, CANVAS_SIZE, CANVAS_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, CANVAS_SIZE, CANVAS_SIZE);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    var projection = mat4.create();
    var modelview;

    var normalMatrix = mat3.create();
    var inverseViewTransform = mat3.create();

    rotator = new Rotator(canvas,draw, 20, 5, 35);

    bindWheelListener(canvas);
    loadTextureCube();

    function loadTextureCube() {
        var urls = [
            "textures/posx.jpg",
            "textures/negx.jpg",
            "textures/posy.jpg",
            "textures/negy.jpg",
            "textures/posz.jpg",
            "textures/negz.jpg",
        ];
        var image_counter = 0;
        var imgs = new Array(6);
        for (var i = 0; i < urls.length; i++) {
            imgs[i] = new Image();
            imgs[i].onload = function () {
                image_counter++;
                if (image_counter == 6) {
                    skybox.cube_map = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox.cube_map);
                    for (var j = 0; j < 6; j++) {
                        gl.texImage2D(texture_consts[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[j]);
                        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    }
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    draw();
                }
            };
            imgs[i].src = urls[i];
        }
    }

    function draw() {
        if (!skybox.cube_map) {
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            return;
        }

        gl.enable(gl.DEPTH_TEST);

        createObjCubemap();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.viewport(0,0,CANVAS_SIZE,CANVAS_SIZE);
        gl.useProgram(skybox.program);

        mat4.perspective(projection, Math.PI/4, canvas.width/canvas.height, 1, SKYBOX_SIZE*2);
        modelview = rotator.getViewMatrix(false);
        renderSkybox();
        modelview = rotator.getViewMatrix();
        mat3.fromMat4(inverseViewTransform, modelview);
        mat3.invert(inverseViewTransform,inverseViewTransform);

        mat3.normalFromMat4(normalMatrix, modelview);

        gl.useProgram(reflect_obj.program);
        mat4.perspective(projection, Math.PI/4, 1, 1, SKYBOX_SIZE);
        gl.uniformMatrix4fv(reflect_obj.u_projection, false, projection);
        mat3.normalFromMat4(normalMatrix, modelview);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflect_obj.cube_map);
        gl.enableVertexAttribArray(reflect_obj.a_position);
        gl.enableVertexAttribArray(reflect_obj.a_normal);
        reflect_obj.model.render();
        gl.disableVertexAttribArray(reflect_obj.a_position);
        gl.disableVertexAttribArray(reflect_obj.a_normal);

    }

    function createModelSkybox(modelData) {
        var model = {};
        model.coordsBuffer = gl.createBuffer();
        model.indexBuffer = gl.createBuffer();
        model.count = modelData.indices.length;
        gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
        model.render = function() {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
            gl.vertexAttribPointer(skybox.a_position, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(skybox.u_modelview, false, modelview );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        };
        return model;
    }

    function createModelReflectObj(modelData) {
        var model = {};
        model.coordsBuffer = gl.createBuffer();
        model.normalBuffer = gl.createBuffer();
        model.indexBuffer = gl.createBuffer();
        model.count = modelData.indices.length;
        gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
        model.render = function() {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
            gl.vertexAttribPointer(reflect_obj.a_position, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(reflect_obj.a_normal, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(reflect_obj.u_modelview, false, modelview );
            gl.uniformMatrix3fv(reflect_obj.u_normalMatrix, false, normalMatrix);
            gl.uniformMatrix3fv(reflect_obj.u_inverseViewTransform, false, inverseViewTransform);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        };
        return model;
    }

    function renderSkybox() {
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(skybox.program);
        gl.uniformMatrix4fv(skybox.u_projection, false, projection);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox.cube_map);
        if (skybox.cube_map) {
            gl.enableVertexAttribArray(skybox.a_position);
            skybox.model.render();
            gl.disableVertexAttribArray(skybox.a_position);
        }
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
            rotator.setViewDistance(rotator.getViewDistance() + delta/50);
        }
    }

    function createObjCubemap() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0,0,CANVAS_SIZE,CANVAS_SIZE);
        mat4.perspective(projection, Math.PI/2, 1, 1, SKYBOX_SIZE*2);

        modelview = mat4.create();

        mat4.identity(modelview);
        mat4.scale(modelview,modelview,[-1,-1,1]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, reflect_obj.cube_map, 0);
        renderSkybox();

        mat4.identity(modelview);
        mat4.scale(modelview,modelview,[-1,-1,1]);
        mat4.rotateY(modelview,modelview,Math.PI/2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, reflect_obj.cube_map, 0);
        renderSkybox();

        mat4.identity(modelview);
        mat4.scale(modelview,modelview,[-1,-1,1]);
        mat4.rotateY(modelview,modelview,Math.PI);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, reflect_obj.cube_map, 0);
        renderSkybox();

        mat4.identity(modelview);
        mat4.scale(modelview,modelview,[-1,-1,1]);
        mat4.rotateY(modelview,modelview,-Math.PI/2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, reflect_obj.cube_map, 0);
        renderSkybox();

        mat4.identity(modelview);
        mat4.rotateX(modelview,modelview,Math.PI/2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, reflect_obj.cube_map, 0);
        renderSkybox();

        mat4.identity(modelview);
        mat4.rotateX(modelview,modelview,-Math.PI/2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, reflect_obj.cube_map, 0);
        renderSkybox();

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflect_obj.cube_map);
        gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
    }

    function loadObjModel(objModelPath, coef_size = 15, dx = 0, dy = -1, dz = 0) {
        var text = getFileContent(objModelPath);
        var lines = text.split('\n');
        var coords = [];
        var normals = [];
        var indices = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length < 4 || lines[i][0] == '#') {
                continue;
            }
            var values = lines[i].split(" ");
            switch (values[0]) {
                case 'v':
                    coords.push(parseFloat(values[1])*coef_size + dx);
                    coords.push(parseFloat(values[2])*coef_size + dy);
                    coords.push(parseFloat(values[3])*coef_size + dz);
                    break;
                case 'vn':
                    normals.push(parseFloat(values[1]));
                    normals.push(parseFloat(values[2]));
                    normals.push(parseFloat(values[3]));
                    break;
                case 'f':
                    indices.push(parseInt(values[1].split('//')[0]) - 1);
                    indices.push(parseInt(values[2].split('//')[0]) - 1);
                    indices.push(parseInt(values[3].split('//')[0]) - 1);
                    break;
                default:
                    console.log('wrong type ' + i +' \"' + lines[i] + '\"' + lines[i].length);
                    break;
            }
        }
        return {
            vertexPositions: new Float32Array(coords),
            vertexNormals: new Float32Array(normals),
            indices: new Uint16Array(indices)
        };
    }

    function makeCube(size = 1) {
        var s = size/2;
        var coords = [];
        var normals = [];
        var indices = [];
        function face(xyz, nrm) {
            var start = coords.length/3;
            var i;
            for (i = 0; i < 12; i++) {
                coords.push(xyz[i]);
            }
            for (i = 0; i < 4; i++) {
                normals.push(nrm[0],nrm[1],nrm[2]);
            }
            indices.push(start,start+1,start+2,start,start+2,start+3);
        }
        face( [-s,-s,s, s,-s,s, s,s,s, -s,s,s], [0,0,1] );
        face( [-s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s], [0,0,-1] );
        face( [-s,s,-s, -s,s,s, s,s,s, s,s,-s], [0,1,0] );
        face( [-s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s], [0,-1,0] );
        face( [s,-s,-s, s,s,-s, s,s,s, s,-s,s], [1,0,0] );
        face( [-s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s], [-1,0,0] );
        return {
            vertexPositions: new Float32Array(coords),
            vertexNormals: new Float32Array(normals),
            indices: new Uint16Array(indices)
        }
    }
}