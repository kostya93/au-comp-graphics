/**
 * Created by kostya on 27.12.2016.
 */

function main() {
    initInput();
    var canvas = document.getElementById('my_Canvas');

    bindWheelListener(canvas);

    var hold = false;
    var curX = 0, curY = 0;
    canvas.onmousedown = mouseDown;
    canvas.onmousemove = mouseMove;
    canvas.onmouseup = mouseUp;

    var gl = canvas.getContext('webgl');

    var shaderProgram = initShaderProgram(gl, 'shaders/vertex.glsl', 'shaders/fragment.glsl');

    var translationLocation = gl.getUniformLocation(shaderProgram, "u_translation");
    var maxIterLocation = gl.getUniformLocation(shaderProgram, 'max_iterations');
    var scaleLocation = gl.getUniformLocation(shaderProgram, "u_scale");
    var max_iter = 100;
    var translation = [0.0, 0.0, 0.0, 0.0];
    var scale = [1.0, 1.0, 1.0, 1.0];

    createGeometryAndBindToBuffer();

    bindTexture();

    setInterval(draw, 17);

    function createGeometryAndBindToBuffer() {
        var vertex_buffer = gl.createBuffer();

        // Bind an empty array buffer to it
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        // Pass the vertices data to the buffer
        var positions = [
            -1, -1,
            -1, 1,
            1, 1,
            -1, -1,
            1, 1,
            1, -1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }

    function draw() {
        var coord = gl.getAttribLocation(shaderProgram, "a_position");

        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(coord);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniform4fv(translationLocation, translation);
        gl.uniform4fv(scaleLocation, scale);
        gl.uniform1i(maxIterLocation, max_iter);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


    function bindTexture() {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        var oneDTextureTexels = new Uint8Array([
            255, 0, 0, 255,
            255, 128, 0, 255,
            255, 255, 0, 255,
            128, 255, 0, 255,
            0, 255, 0, 255,
            0, 255, 255, 255,
            0, 0, 255, 255,
            127, 0, 255, 255,
        ]);

        var width = 8;
        var height = 1;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            oneDTextureTexels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    function bindWheelListener(elem) {
        if (elem.addEventListener) {
            if ('onwheel' in document) {
                // IE9+, FF17+
                elem.addEventListener("wheel", onWheel);
            } else if ('onmousewheel' in document) {
                // устаревший вариант события
                elem.addEventListener("mousewheel", onWheel);
            } else {
                // Firefox < 17
                elem.addEventListener("MozMousePixelScroll", onWheel);
            }
        } else { // IE8-
            elem.attachEvent("onmousewheel", onWheel);
        }


        // Это решение предусматривает поддержку IE8-
        function onWheel(e) {
            e = e || window.event;

            // deltaY, detail содержат пиксели
            // wheelDelta не дает возможность узнать количество пикселей
            // onwheel || MozMousePixelScroll || onmousewheel
            var delta = e.deltaY || e.detail || e.wheelDelta;

            var info = document.getElementById('position');
            var delta_scale = -delta / 1000.0;
            var old_scale_x = scale[0];
            var old_scale_y = scale[1];
            scale[0] = scale[1] = scale[0] * (1 + delta_scale);
            if (scale[0] < 0.95) {
                scale[0] = scale[1] = 1.0;
            } else {
                var DXP = (e.x - (canvas.width / 2.0) * (translation[0] + 1.0));
                var dXP = (DXP / old_scale_x) * scale[0] - DXP;
                var dXC = dXP / (canvas.width / 2.0);
                translation[0] -= dXC;

                var DYP = (e.y - (canvas.height / 2.0) * (1.0 - translation[1]));
                var dYP = DYP * ((scale[1] / old_scale_y) - 1.0);
                var dYC = dYP / (canvas.height / 2.0);
                translation[1] += dYC;
            }
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        }
    }

    function mouseDown() {
        hold = true;
        curX = window.event.x;
        curY = window.event.y;
    }

    function mouseUp() {
        hold = false;
    }

    function mouseMove() {
        if (!hold) {
            return;
        }
        translation[0] -= ((curX - window.event.x) / canvas.width) * 2;
        translation[1] += ((curY - window.event.y) / canvas.height) * 2;
        curX = window.event.x;
        curY = window.event.y;
    }

    function initInput() {
        var input = document.getElementById("iterations_in");
        input.oninput = function () {
            var iter = input.value;
            if (iter < 1) {
                iter = 1;
                this.value = iter;
            }
            if (iter > 100) {
                iter = 100;
                this.value = iter;
            }
            var iter_out = document.getElementById("iterations_out");
            iter_out.innerHTML = iter;
            max_iter = iter;
            translation = [0.0, 0.0, 0.0, 0.0];
            scale = [1.0, 1.0, 1.0, 1.0];
            createGeometryAndBindToBuffer();
        };
    }
}