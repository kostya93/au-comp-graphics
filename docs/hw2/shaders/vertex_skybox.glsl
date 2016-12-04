precision highp float;

uniform mat4 projection;
uniform mat4 modelview;

attribute vec3 position;
varying vec3 v_texCoord;
void main(void) {
    vec4 eye = modelview * vec4(position, 1.0);
    gl_Position = projection * eye;
    v_texCoord = position;
}
