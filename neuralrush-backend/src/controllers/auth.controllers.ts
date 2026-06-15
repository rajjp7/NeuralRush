import {Request,Response} from 'express';

import {db} from '../config/database';
import {hashPassword,comparePassword} from '../utils/auth';


export const register = async(req:Request,res:Response)=>{
    try {
        const {username,email,password,name} = req.body; 
        const existingUser = await db.user.findFirst({
            where:{
                OR:[
                    {username},
                    {email}
                ]
            }
        });
        if(existingUser){
            return res.status(400).json({
                status:'error',
                message:'Username or email already exists'
            })
            return;
        }
            const passwordHash = await hashPassword(password);
            const newUser = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        name,
        brainProfile: {
          create: {}, 
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: newUser,
    });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({
            status:'error',
            message:'Internal server error'
        })
    }
}

    export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await db.user.findUnique({ where: { email } });
    
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    
    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
      return;
    }
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
        