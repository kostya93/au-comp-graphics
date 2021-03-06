function Rotator(canvas,
                 callback,
                 viewDistance = 5,
                 minViewDistance = 0,
                 maxViewDistance = 50,
                 rotateX = 0,
                 rotateY = 0,
                 holdX = false,
                 holdY = false,
                 x_limit = 90,
                 y_limit = 90) {
    canvas.addEventListener("mousedown", doMouseDown, false);
    var canvas_rect = canvas.getBoundingClientRect();
    var DEGREE_PER_PIXEL = 90/canvas.height;
    this.setViewDistance = function( dist ) {
        viewDistance = dist;
        if (viewDistance < minViewDistance) {
            viewDistance = minViewDistance;
        }
        if (viewDistance > maxViewDistance) {
            viewDistance = maxViewDistance;
        }
        if (callback) {
            callback();
        }
    };
    this.getViewDistance = function() {
        return viewDistance;
    };
    this.getRotX = function () {
        return rotateX;
    };
    this.getRotY = function () {
        return rotateY;
    };

    this.getPosition = function () {
        var vd = this.getViewMatrix();
        mat4.invert(vd, vd);
        return [vd[12], vd[13], vd[14]];
    };
    this.getViewMatrix = function(vd = true) {
        var cosX = Math.cos(rotateX/180*Math.PI);
        var sinX = Math.sin(rotateX/180*Math.PI);
        var cosY = Math.cos(rotateY/180*Math.PI);
        var sinY = Math.sin(rotateY/180*Math.PI);
        var res = [
            cosY, sinX * sinY, -cosX * sinY, 0,
            0, cosX, sinX, 0,
            sinY, -sinX * cosY, cosX * cosY, 0,
            0, 0, 0, 1
        ];
        if (vd) {
            res[14] -= viewDistance;
        }
        return res;
    };
    var prevX, prevY;
    var dragging = false;
    function doMouseDown(evt) {
        if (dragging) {
            return;
        }
        dragging = true;
        document.addEventListener("mousemove", doMouseDrag, false);
        document.addEventListener("mouseup", doMouseUp, false);
        prevX = evt.clientX - canvas_rect.left;
        prevY = evt.clientY - canvas_rect.top;
    }
    function doMouseDrag(evt) {
        if (!dragging) {
            return; 
        }
        var x = evt.clientX - canvas_rect.left;
        var y = evt.clientY - canvas_rect.top;

        var newRotX = rotateX;
        if (!holdX) {
            newRotX += DEGREE_PER_PIXEL * (y - prevY);
        }

        var newRotY = rotateY;
        if (!holdY) {
            newRotY += DEGREE_PER_PIXEL * (x - prevX);
        }

        newRotX = Math.max(-x_limit, Math.min(x_limit,newRotX));
        newRotY = Math.max(-y_limit, Math.min(y_limit,newRotY));
        prevX = x;
        prevY = y;
        if (newRotX != rotateX || newRotY != rotateY) {
            rotateX = newRotX;
            rotateY = newRotY;
            if (callback) {
                callback();
            }
        }
    }
    function doMouseUp(evt) {
        if (!dragging) {
            return;
        }
        dragging = false;
        document.removeEventListener("mousemove", doMouseDrag, false);
        document.removeEventListener("mouseup", doMouseUp, false);
    }
}
