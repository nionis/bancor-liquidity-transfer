const safeFetch = async (...args) => {
  return fetch(...args).then(res => {
    if (res.ok) {
      return res;
    }

    throw Error("response not ok");
  });
};

export default safeFetch;
