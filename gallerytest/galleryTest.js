const track = document.getElementById('image-track');

if (track) {
  const handleOnDown = (event) => {
    track.dataset.mouseDownAt = event.clientX;
  };

  const handleOnUp = () => {
    track.dataset.mouseDownAt = '0';
    track.dataset.prevPercentage = track.dataset.percentage ?? '0';
  };

  const handleOnMove = (event) => {
    if (track.dataset.mouseDownAt === '0') return;

    const mouseDelta = parseFloat(track.dataset.mouseDownAt) - event.clientX;
    const maxDelta = window.innerWidth * 1.5;
    const percentage = (mouseDelta / maxDelta) * -100;
    const nextPercentageUnconstrained =
      parseFloat(track.dataset.prevPercentage || '0') + percentage;
    const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);

    track.dataset.percentage = nextPercentage;

    track.animate(
      {
        transform: `translate(${nextPercentage}%, -50%)`,
      },
      { duration: 1200, fill: 'forwards' }
    );

    for (const image of track.getElementsByClassName('image')) {
      image.animate(
        {
          objectPosition: `${100 + nextPercentage}% center`,
        },
        { duration: 1200, fill: 'forwards' }
      );
    }
  };

  window.addEventListener('mousedown', handleOnDown);
  window.addEventListener('touchstart', (event) => handleOnDown(event.touches[0]), { passive: true });

  window.addEventListener('mouseup', handleOnUp);
  window.addEventListener('touchend', handleOnUp, { passive: true });

  window.addEventListener('mousemove', handleOnMove);
  window.addEventListener('touchmove', (event) => handleOnMove(event.touches[0]), { passive: true });
}
