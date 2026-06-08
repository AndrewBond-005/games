// src/main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from "@/pages/Home";
import { GameWrapper } from '@/pages/GameWrapper';
import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import React from 'react';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter basename="/games">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game/:gameId" element={<GameWrapper  />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);