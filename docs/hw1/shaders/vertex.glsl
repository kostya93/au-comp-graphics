attribute vec4 a_position;
uniform vec4 u_translation;
uniform vec4 u_scale;
varying vec4 v_texCoord;
void main(void) {
  gl_Position = a_position*u_scale + u_translation;
  v_texCoord = a_position;
}
