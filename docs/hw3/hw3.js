/**
 * Created by kostya on 24.12.2016.
 */

function main() {
    var canvas = document.getElementById('my-canvas');
    var gl = canvas.getContext('webgl');

    var shaderProgram = initShaderProgram(gl, 'shaders/vertex.glsl', 'shaders/fragment.glsl');

    var model = createModelReflectObj(loadObjModel('models/bunny_with_normals.obj'));

    var a_position = gl.getAttribLocation(shaderProgram, "a_position");
    var a_normal = gl.getAttribLocation(shaderProgram, "a_normal");
    var a_texCood = gl.getAttribLocation(shaderProgram, "a_texCood");

    var u_projection = gl.getUniformLocation(shaderProgram, "projection");
    var u_modelview = gl.getUniformLocation(shaderProgram, "modelview");
    var u_normalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");

    var u_lightPoses = [gl.getUniformLocation(shaderProgram, "lightPos_0"),
                        gl.getUniformLocation(shaderProgram, "lightPos_1")];

    var lightAngle = 0.0;
    var lightTrajectoryRadius = 20;
    var lightPoses = [[0.0, 0.0, 0.0],
                      [0.0, 0.0, 0.0]];

    var projection = mat4.create();
    var modelview;
    var normalMatrix = mat3.create();
    var inverseViewTransform = mat3.create();

    var rotator = new Rotator(canvas, draw, 10, 2, 35, 20, 0, true);

    function draw() {
        gl.clearColor(0.0, 0.0, 0.0, 0.1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        modelview = rotator.getViewMatrix();
        mat4.perspective(projection, Math.PI/4, canvas.width/canvas.height, 1, 100);
        mat3.fromMat4(inverseViewTransform, modelview);
        mat3.invert(inverseViewTransform,inverseViewTransform);
        mat3.normalFromMat4(normalMatrix, modelview);

        gl.useProgram(shaderProgram);
        gl.uniformMatrix4fv(u_projection, false, projection);
        setLights();
        gl.enableVertexAttribArray(a_position);
        gl.enableVertexAttribArray(a_normal);

        model.render();
    }

    setInterval(updateLight, 50);

    function updateLight() {
        lightAngle = (lightAngle + Math.PI / 50) % (2 * Math.PI);
        lightPoses[0][1] = lightTrajectoryRadius*Math.cos(lightAngle);
        lightPoses[0][2] = lightTrajectoryRadius*Math.sin(lightAngle);

        lightPoses[1][0] = lightTrajectoryRadius*Math.cos(-lightAngle);
        lightPoses[1][1] = lightTrajectoryRadius*Math.sin(-lightAngle);
        draw();
    }

    function setLights() {
        for (var i = 0; i < lightPoses.length; i++) {
            gl.uniform3f(u_lightPoses[i], lightPoses[i][0], lightPoses[i][1], lightPoses[i][2]);
        }
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
            gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(u_modelview, false, modelview);
            gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        };
        return model;
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
}


