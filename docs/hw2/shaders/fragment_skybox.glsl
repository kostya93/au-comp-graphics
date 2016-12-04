precision highp float;

uniform samplerCube skybox;

varying vec3 v_texCoord;

void main(void) {
    gl_FragColor = textureCube(skybox, v_texCoord);
}
