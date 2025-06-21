import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const BLUE_COLOR = '#000082';

function CustomCursor() {
  const cursorRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false); // To hide until first move
  const [isHovering, setIsHovering] = useState(false); // For general interactive elements
  const [isTextHovering, setIsTextHovering] = useState(false); // For text inputs
  const [isJoinButtonHovering, setIsJoinButtonHovering] = useState(false); // Specific button

  // Debounce mouse move to avoid excessive updates
  const trailingPosition = useRef({ x: 0, y: 0 }).current;

  useEffect(() => {
    const styleElementId = 'custom-cursor-hide-styles';

    const handleMouseMove = (event) => {
      setPosition({ x: event.clientX, y: event.clientY });
      if (!isVisible) {
        setIsVisible(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const generalInteractiveElements = document.querySelectorAll(
      'a, button:not([data-cursor-target="join-button"]), [role="button"]:not([data-cursor-target="join-button"]), [data-interactive]'
    );
    const textInputElements = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], textarea'
    );
    const joinButtonElements = document.querySelectorAll('[data-cursor-target="join-button"]');

    const handleGeneralMouseEnter = () => {
      if (!isTextHovering && !isJoinButtonHovering) setIsHovering(true);
    };
    const handleGeneralMouseLeave = () => setIsHovering(false);

    const handleTextMouseEnter = () => {
      setIsTextHovering(true);
      setIsHovering(false);
      setIsJoinButtonHovering(false);
    };
    const handleTextMouseLeave = () => setIsTextHovering(false);

    const handleJoinButtonMouseEnter = (event) => {
      if (event.target.disabled) {
        // If button is disabled, do not apply special hover; let default custom cursor show
        setIsJoinButtonHovering(false);
        setIsHovering(false); // Ensure general hover doesn't also trigger
        event.target.style.cursor = ''; // Ensure our global none !important applies
        return;
      }
      setIsJoinButtonHovering(true);
      setIsHovering(false); // Ensure other hovers are off
      setIsTextHovering(false); // Ensure other hovers are off
      event.target.style.cursor = 'pointer'; // Show default cursor on the button
    };
    const handleJoinButtonMouseLeave = (event) => {
      setIsJoinButtonHovering(false);
      event.target.style.cursor = '';
    };

    generalInteractiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleGeneralMouseEnter);
      el.addEventListener('mouseleave', handleGeneralMouseLeave);
    });

    textInputElements.forEach(el => {
      el.addEventListener('mouseenter', handleTextMouseEnter);
      el.addEventListener('mouseleave', handleTextMouseLeave);
      el.addEventListener('blur', handleTextMouseLeave);
    });
    joinButtonElements.forEach(el => {
      el.addEventListener('mouseenter', handleJoinButtonMouseEnter);
      el.addEventListener('mouseleave', handleJoinButtonMouseLeave);
    });
    
    document.querySelectorAll('input').forEach(el => {
        if (!el.matches('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"]')) {
            // This ensures other input types (like checkbox, radio, range, submit button styled as input) also hide default cursor
            el.style.cursor = 'none !important';
        }
    });

    // Inject a global style tag to hide cursors
    let styleElement = document.getElementById(styleElementId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleElementId;
      styleElement.innerHTML = `
        body, body *,
        a, button, input, textarea,
        [role="button"], [data-interactive],
        input[type="text"], input[type="email"], input[type="password"], 
        input[type="search"], input[type="tel"], input[type="url"],
        input[type="number"], input[type="date"], input[type="submit"],
        input[type="reset"], input[type="file"], input[type="range"],
        input[type="checkbox"], input[type="radio"] {
          cursor: none !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
    // document.body.style.cursor = 'none !important'; // Style tag should handle this

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      generalInteractiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleGeneralMouseEnter);
        el.removeEventListener('mouseleave', handleGeneralMouseLeave);
      });
      textInputElements.forEach(el => {
        el.removeEventListener('mouseenter', handleTextMouseEnter);
        el.removeEventListener('mouseleave', handleTextMouseLeave);
        el.removeEventListener('blur', handleTextMouseLeave);
      });
      joinButtonElements.forEach(el => {
        el.removeEventListener('mouseenter', handleJoinButtonMouseEnter);
        el.removeEventListener('mouseleave', handleJoinButtonMouseLeave);
      });
      document.querySelectorAll('input').forEach(el => {
        el.style.cursor = '';
      });
      
      const existingStyleElement = document.getElementById(styleElementId);
      if (existingStyleElement) {
        existingStyleElement.remove();
      }
      document.body.style.cursor = 'auto';
    };
  }, [isVisible, isTextHovering, isJoinButtonHovering, isHovering]);

  useEffect(() => {
    if (cursorRef.current && isVisible) {
      gsap.to(trailingPosition, {
        x: position.x,
        y: position.y,
        duration: 0.15, // Slightly faster for responsiveness
        ease: 'power2.out',
        onUpdate: () => {
          if (cursorRef.current) {
            const currentWidth = cursorRef.current.offsetWidth;
            const currentHeight = cursorRef.current.offsetHeight;
            cursorRef.current.style.transform = `translate3d(${trailingPosition.x - currentWidth / 2}px, ${trailingPosition.y - currentHeight / 2}px, 0)`;
          }
        }
      });
    }
  }, [position, isVisible, trailingPosition]);

  const regularCursorSize = 15;
  const hoverCursorSize = 30;
  const dotSize = 6;

  let cursorWidth = `${regularCursorSize}px`;
  let cursorHeight = `${regularCursorSize}px`;
  let cursorBorderRadius = '50%';
  let cursorBackgroundColor = 'white';
  let cursorBorder = 'none';
  let showDot = false;

  if (isTextHovering) {
    cursorWidth = '2px';
    cursorHeight = `${regularCursorSize * 1.5}px`;
    cursorBorderRadius = '1px';
    cursorBackgroundColor = 'white';
    cursorBorder = 'none';
  } else if (isHovering) {
    cursorWidth = `${hoverCursorSize}px`;
    cursorHeight = `${hoverCursorSize}px`;
    cursorBorderRadius = '50%';
    cursorBackgroundColor = 'white';
    cursorBorder = 'none';
  } else {
    cursorWidth = `${regularCursorSize}px`;
    cursorHeight = `${regularCursorSize}px`;
    cursorBorderRadius = '50%';
    cursorBackgroundColor = 'white';
    cursorBorder = 'none';
  }

  const customCursorOpacity = isVisible && !isJoinButtonHovering ? 1 : 0;

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: cursorWidth,
        height: cursorHeight,
        backgroundColor: cursorBackgroundColor,
        borderRadius: cursorBorderRadius,
        border: cursorBorder,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: customCursorOpacity,
        transition: 'width 0.15s ease-in-out, height 0.15s ease-in-out, border-radius 0.15s ease-in-out, background-color 0.15s ease-in-out, border 0.15s ease-in-out, opacity 0.15s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
    </div>
  );
}

export default CustomCursor; 