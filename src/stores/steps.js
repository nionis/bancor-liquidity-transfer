import { writable, derived, get } from "svelte/store";

export const Step = ({ text, fn, fnOps = {}, after, skipable, inputMsg }) => {
  const step = writable({
    text,
    fn,
    fnOps,
    after,
    skipable,
    inputMsg,
    pending: false,
    success: undefined,
    txHash: undefined
  });

  // wrap fn to provide step instance
  step.update(_step => {
    _step.fn = () => {
      return fn(step);
    };

    return _step;
  });

  return step;
};

export const SyncStep = fn => step => {
  step.update(o => ({
    ...o,
    pending: true
  }));

  const fail = () => {
    step.update(o => ({
      ...o,
      success: undefined,
      pending: false
    }));
  };

  return fn(step)
    .then(tx => {
      return new Promise((resolve, reject) => {
        step.update(o => ({
          ...o,
          success: undefined,
          pending: true
        }));

        tx.getTxHash()
          .then(txHash => {
            step.update(o => ({
              ...o,
              txHash
            }));
          })
          .catch(reject);

        tx.getReceipt()
          .then(receipt => {
            step.update(o => ({
              ...o,
              success: true,
              pending: false
            }));

            nextStep();

            return receipt;
          })
          .then(resolve)
          .catch(reject);
      }).catch(err => {
        console.error(err);
        fail();
      });
    })
    .then(receipt => {
      if (get(step).after) {
        return get(step).after(receipt);
      }

      return receipt;
    })
    .catch(err => {
      console.error(err);
      fail();
    });
};

export const steps = writable([]);
export const onStep = writable(0);

export const done = derived([steps, onStep], (_steps, _onStep) => {
  return Boolean(_steps.length <= _onStep);
});

export const addSteps = _steps => {
  steps.update(() => _steps);
};

export const nextStep = () => {
  onStep.update(val => {
    const nextVal = val + 1;

    if (nextVal > get(steps).length) {
      return val;
    }

    return nextVal;
  });
};
