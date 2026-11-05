import assert from 'node:assert/strict';
import test from 'node:test';
import { getLandingBallMotion } from './landingBallMotion.js';

test('the ball falls onto the paddle before launching upward', () => {
    const start = getLandingBallMotion(0);
    const contact = getLandingBallMotion(0.14);
    const airborne = getLandingBallMotion(0.35);

    assert.ok(start.y < contact.y);
    assert.ok(airborne.y < contact.y - 0.4);
    assert.equal(contact.paddleOpacity, 1);
    assert.equal(airborne.paddleOpacity, 0);
});

test('the ball settles at the bottom with its strongest contact shadow', () => {
    const airborne = getLandingBallMotion(0.35);
    const settled = getLandingBallMotion(1);

    assert.equal(settled.y, 0.94);
    assert.equal(settled.rotation, 1080);
    assert.equal(settled.shadowScale, 1);
    assert.ok(settled.shadowOpacity > airborne.shadowOpacity);
    assert.deepEqual(getLandingBallMotion(2), settled);
    assert.deepEqual(getLandingBallMotion(-1), getLandingBallMotion(0));
});

test('the path stays in view and continuous when crossing each arc', () => {
    for (let i = 0; i <= 1000; i++) {
        const frame = getLandingBallMotion(i / 1000);
        assert.ok(frame.x >= 0.75 && frame.x <= 0.91);
        assert.ok(frame.y >= 0 && frame.y <= 0.94);
    }

    for (const boundary of [0.14, 0.56, 0.86]) {
        const before = getLandingBallMotion(boundary - 0.00001);
        const after = getLandingBallMotion(boundary + 0.00001);
        assert.ok(Math.abs(after.x - before.x) < 0.001);
        assert.ok(Math.abs(after.y - before.y) < 0.001);
    }
});

test('every airborne bounce has a paddle aligned beneath the contact point', () => {
    for (const at of [0.14, 0.56, 0.86]) {
        const contact = getLandingBallMotion(at);
        const before = getLandingBallMotion(at - 0.02);
        const after = getLandingBallMotion(at + 0.02);

        assert.equal(contact.paddleX, contact.x);
        assert.equal(contact.paddleY, contact.y);
        assert.equal(contact.paddleOpacity, 1);
        assert.equal(Math.abs(contact.paddleRotation), 0);
        assert.equal(Math.abs(contact.paddleLift), 0);
        assert.equal(contact.impact, 1);
        assert.equal(contact.scaleY, 0.88);
        assert.equal(contact.scaleX, 1.12);
        assert.ok(before.paddleLift > contact.paddleLift);
        assert.ok(after.paddleLift < contact.paddleLift);
        assert.ok(before.y < contact.y);
        assert.ok(after.y < contact.y);
        assert.equal(after.scaleY, 1);
    }
});

test('the paddle clears the final resting position', () => {
    const settled = getLandingBallMotion(1);

    assert.equal(settled.paddleOpacity, 0);
    assert.equal(settled.impact, 0);
    assert.equal(settled.scaleX, 1);
    assert.equal(settled.scaleY, 1);
});