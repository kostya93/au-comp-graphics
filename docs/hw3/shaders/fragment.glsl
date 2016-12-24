precision highp float;

varying vec3 v_normal;
varying vec3 v_eye;

uniform vec3 lightPos_0;
uniform vec3 lightPos_1;
const vec3 diffuseColor = vec3(0.0, 0.2, 0.0);
const vec3 specColor = vec3(1.0, 1.0, 1.0);

vec3 lightColor(vec3 lightPos) {
  vec3 lightDir = normalize(lightPos - v_eye);

  float lambertian = max(dot(lightDir,v_normal), 0.0);
  float specular = 0.0;

  if(lambertian > 0.0) {

    vec3 reflectDir = reflect(-lightDir, v_normal);
    vec3 viewDir = normalize(-v_eye);

    float specAngle = max(dot(reflectDir, viewDir), 0.0);
    specular = pow(specAngle, 8.0);
  }
  return lambertian*diffuseColor + specular*specColor;
}

void main() {
  vec3 l0 = lightColor(lightPos_0);
  vec3 l1 = lightColor(lightPos_1);
  gl_FragColor = vec4(l0 + l1, 1.0);
}
