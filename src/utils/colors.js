const colors = {
  containerBg: "#FFFEFE",
  containerFont: "black",
  containerBorder: "rgba(11, 46, 87, 0.4)",
  inputBg: "#FFFEFE",
  inputFont: "black",
  inputBorder: "#0B2E57",
  selectBg: "#F0F0F0",
  selectFont: "black",
  selectBorder: "#0B2E57",
  buttonBg: "#0B2E57",
  buttonFont: "white",
  buttonBorder: "#000000",
  compareArrows: "#0B2E57",
  selectArrow: "black"
};

export const Cursor = ({ disabled, loading }) => {
  if (disabled || loading) return "default";

  return "pointer";
};

export const Opacity = ({ disabled, hover }) => {
  if (disabled || hover) return 0.75;

  return 1;
};

export default colors;
