precision highp float;

uniform mat4 projection;
uniform mat4 modelview;

attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_eye;
varying vec3 v_normal;

void main() {
    vec4 eye = modelview * vec4(a_position, 1.0);
    gl_Position = projection * eye;
    v_eye = eye.xyz;
    v_normal = normalize(a_normal);
}
