precision highp float;

varying vec3 v_normal;
varying vec3 v_eye;

uniform vec3 lightPos_0;
uniform vec3 lightPos_1;
uniform vec3 lightPos_2;
uniform int mode;
uniform int num_of_lights;
const vec3 ambientColor = vec3(0.0, 0.15, 0.0);
const vec3 diffuseColor = vec3(0.0, 0.25, 0.0);
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


  if (mode == 1) {
    return ambientColor + lambertian*diffuseColor + specular*specColor;
  }
  if (mode == 2) {
    return ambientColor;
  }
  if (mode == 3) {
    return lambertian*diffuseColor;
  }
  if (mode == 4) {
    return specular*specColor;
  }

  return ambientColor + lambertian*diffuseColor + specular*specColor;
}

void main() {
  vec3 l = vec3(0,0,0);
  if (num_of_lights >= 1) {
    l += lightColor(lightPos_0);
  }
  if (num_of_lights >= 2) {
    l += lightColor(lightPos_1);
  }
  if (num_of_lights >= 3) {
    l += lightColor(lightPos_2);
  }
  gl_FragColor = vec4(l, 1.0);
}
