import { wait } from '../../utils/tick/tick'

type ConfettiProps = {
  duration?: number
}

export const showConfetti = async ({ ...props }: ConfettiProps = {}) => {
  // the confetti library loads the first time it is shown
  const { default: confetti } = await import('canvas-confetti')
  const canvas = document.getElementById('canvas') // in app.svelte - bad I know
  const explosion = confetti.create(canvas, {
    resize: true,
    particleCount: 100,
    spread: 80,
    origin: { y: 0.6 },
    zIndex: 10000,
  })
  explosion()
  await wait(props.duration || 3000)
  explosion.reset()
}
