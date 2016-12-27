precision highp float;


attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texCoord;
attribute vec3 a_tangent;
attribute vec3 a_bitangent;

uniform mat4 u_projection;
uniform mat4 u_model;
uniform mat4 u_view;

uniform vec3 u_light;
uniform vec3 u_viewPos;

varying vec3 v_fragPos;
varying vec2 v_texCoord;
varying vec3 v_tangentLight;
varying vec3 v_tangentViewPos;
varying vec3 v_tangentFragPos;

mat3 transpose(mat3 m) {
  return mat3(
    m[0].x, m[1].x, m[2].x,
    m[0].y, m[1].y, m[2].y,
    m[0].z, m[1].z, m[2].z
  );
}

void main() {
  gl_Position = u_projection * u_model * u_view * vec4(a_position, 1.0);
  v_fragPos = vec3(u_model  * vec4(a_position, 1.0));
  v_texCoord = a_texCoord;
  vec3 T = normalize(mat3(u_model) * a_tangent);
  vec3 B = normalize(mat3(u_model) * a_bitangent);
  vec3 N = normalize(mat3(u_model) * a_normal);
  mat3 TBN = transpose(mat3(T, B, N));
  v_tangentLight = TBN * u_light;
  v_tangentViewPos  = TBN * u_viewPos;
  v_tangentFragPos  = TBN * v_fragPos;
}
