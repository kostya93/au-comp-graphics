precision highp float;

uniform samplerCube skybox;
uniform mat3 normalMatrix;
uniform mat3 inverseViewTransform;

varying vec3 v_eye;
varying vec3 v_normal;

void main() {
    vec3 N = normalize(normalMatrix * v_normal);
    vec3 V = -v_eye;
    vec3 R = -reflect(V,N);
    vec3 T = inverseViewTransform * R;
    gl_FragColor = textureCube(skybox, T);
}
