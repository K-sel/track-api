import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { validateEmail } from "../../middleware/auth/validateEmail.mjs";
import { validateFirstname } from "../../middleware/auth/validateFirstname.mjs";
import { validateLastname } from "../../middleware/auth/validateLastname.mjs";
import { validatePassword } from "../../middleware/auth/validatePassword.mjs";
import { validateUsername } from "../../middleware/auth/validateUsername.mjs";

describe("Middlewares validation for form submissions", () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe("validateEmail", () => {
        it("should call next() for valid email", () => {
            req.body.email = "test@exemple.com";

            validateEmail(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 422 when email is missing", () => {
            req.body.email = undefined;

            validateEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "L'email est requis",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 422 for invalid email format", () => {
            req.body.email = "not-an-email";

            validateEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Veuillez entrer une adresse mail valide",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 422 for email without domain", () => {
            req.body.email = "test@";

            validateEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
        });
    });

    describe("validateFirstname", () => {
        it("should call next() for valid firstname", () => {
            req.body.firstname = "John";

            validateFirstname(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 422 when firstname is missing", () => {
            req.body.firstname = undefined;

            validateFirstname(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le firstname est requis",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 422 when firstname is too short", () => {
            req.body.firstname = "J";

            validateFirstname(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le firstname doit contenir minimum 2 caractères",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() for firstname with exactly 2 characters", () => {
            req.body.firstname = "Jo";

            validateFirstname(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("validateLastname", () => {
        it("should call next() for valid lastname", () => {
            req.body.lastname = "Doe";

            validateLastname(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 422 when lastname is missing", () => {
            req.body.lastname = undefined;

            validateLastname(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le lastname est requis",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 422 when lastname is too short", () => {
            req.body.lastname = "D";

            validateLastname(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le lastname doit contenir minimum 2 caractères",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() for lastname with exactly 2 characters", () => {
            req.body.lastname = "Do";

            validateLastname(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("validatePassword", () => {
        it("should call next() for valid password", () => {
            req.body.password = "SecurePass123";

            validatePassword(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 422 when password is missing", () => {
            req.body.password = undefined;

            validatePassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le mot de passe est requis",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 422 when password is too short", () => {
            req.body.password = "Short123";

            validatePassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le mot de passe doit contenir minimum 10 caractères",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() for password with exactly 10 characters", () => {
            req.body.password = "Exactly10!";

            validatePassword(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("validateUsername", () => {
        it("should call next() for valid username", () => {
            req.body.username = "johndoe";

            validateUsername(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 422 when username is missing", () => {
            req.body.username = undefined;

            validateUsername(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le username est requis",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 422 when username is too short", () => {
            req.body.username = "j";

            validateUsername(req, res, next);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Le username doit contenir minimum 2 caractères",
                    code: "ERR_VALIDATION"
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next() for username with exactly 2 characters", () => {
            req.body.username = "jo";

            validateUsername(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
