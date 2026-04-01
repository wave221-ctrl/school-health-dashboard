'use client';

import HealthCalculator from './components/HealthCalculator';
import { Show, RedirectToSignIn } from '@clerk/nextjs';

export default function Home() {
    return (
        <>
            <Show when="signed-in">
                <HealthCalculator />
            </Show>

            <Show when="signed-out">
                <RedirectToSignIn />
            </Show>
        </>
    );
}