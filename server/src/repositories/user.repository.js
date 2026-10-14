import prisma from "../config/prisma.js";

export const findUserByEmail = async (email) => {

    return prisma.user.findUnique({

        where: {

            email

        },

        include: {

            company: true

        }

    });

};

export const createCompany = async (data) => {

    return prisma.company.create({

        data

    });

};

export const createUser = async (data) => {

    return prisma.user.create({

        data,

        include: {

            company: true

        }

    });

};