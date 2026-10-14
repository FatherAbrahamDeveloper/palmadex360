import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {

    try {

        const result = await authService.register(req.body);

        res.status(201).json(result);

    }

    catch (err) {

        res.status(400).json({

            message: err.message

        });

    }

};

export const login = async (req, res) => {

    try {

        const result = await authService.login(

            req.body.email,

            req.body.password

        );

        res.json(result);

    }

    catch (err) {

        res.status(401).json({

            message: err.message

        });

    }

};

export const me = async (req, res) => {

    res.status(200).json({
        success: true,
        user: req.user
    });

};