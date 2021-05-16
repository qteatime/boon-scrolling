"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (ffi) => {
    ffi.defun("action.score", (x) => ffi.float(ffi.action_choice(x).score));
    ffi.defun("action.action", (x) => ffi.action_choice(x).action);
};
