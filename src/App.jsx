import React, { useEffect, useState, useRef, useMemo } from 'react';
import TrimmedImage from './TrimmedImage';
import CustomCursor from './CustomCursor';
import gsap from 'gsap';
import InertiaPlugin from 'gsap/InertiaPlugin';
import SplitText from 'gsap/SplitText';
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(InertiaPlugin);
gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrambleTextPlugin);

function SelectionOverlay({ targetRef }) {
  const [rects, setRects] = useState([]);
  const [active, setActive] = useState(false);
  const [maskStyle, setMaskStyle] = useState({ WebkitMaskImage: 'none', maskImage: 'none' });

  useEffect(() => {
    if (!document.getElementById('selection-anim-style')) {
      const style = document.createElement('style');
      style.id = 'selection-anim-style';
      style.innerHTML = `
        @keyframes selectionColorCycle {
          0% { background-color: rgba(0, 0, 130, 0.5); }
          50% { background-color: rgba(0, 0, 0, 0.5); }
          100% { background-color: rgba(0, 0, 130, 0.5); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const updateRects = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setRects([]);
        setActive(false);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!targetRef.current || !targetRef.current.contains(range.commonAncestorContainer)) {
        setRects([]);
        setActive(false);
        return;
      }
      const clientRects = Array.from(range.getClientRects());
      setRects(clientRects);
      setActive(true);
    };

    document.addEventListener('selectionchange', updateRects);
    window.addEventListener('resize', updateRects);
    updateRects(); // Initial check

    return () => {
      document.removeEventListener('selectionchange', updateRects);
      window.removeEventListener('resize', updateRects);
    };
  }, [targetRef]);

  useEffect(() => {
    if (active && rects.length > 0 && targetRef.current) {
      const targetBoundingRect = targetRef.current.getBoundingClientRect();
      const svgWidth = Math.max(1, targetBoundingRect.width);
      const svgHeight = Math.max(1, targetBoundingRect.height);

      const svgRectsString = rects.map(r => {
        const x = r.left - targetBoundingRect.left;
        const y = r.top - targetBoundingRect.top;
        const width = Math.max(0, r.width);
        const height = Math.max(0, r.height);
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white" rx="2"/>`;
      }).join('');

      const svgString = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">${svgRectsString}</svg>`;
      const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgString)}")`;
      setMaskStyle({
        WebkitMaskImage: dataUrl,
        maskImage: dataUrl,
        WebkitMaskMode: 'alpha',
        maskMode: 'alpha',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: '0 0',
        maskPosition: '0 0',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      });
    } else {
      setMaskStyle({ WebkitMaskImage: 'none', maskImage: 'none' });
    }
  }, [rects, active, targetRef]);

  if (!active || rects.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0, 
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          animation: 'selectionColorCycle 2.4s linear infinite',
          ...maskStyle,
        }}
      />
    </div>
  );
}

function App() {
  const rootRef = useRef(null)
  const h1Ref = useRef(null)
  const emailInputMobileRef = useRef(null);
  const emailInputDesktopRef = useRef(null);
  const scrambleOverlayMobileRef = useRef(null);
  const scrambleOverlayDesktopRef = useRef(null);

  // State to track viewport size
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // State for button hover effects
  const [buttonHoverMobile, setButtonHoverMobile] = useState(false);
  const [buttonHoverDesktop, setButtonHoverDesktop] = useState(false);

  // State for email input and submission
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scrambleVisible, setScrambleVisible] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Get API URL from environment or use default
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Create a style reset to override any global styles
  const resetStyles = {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box'
  };
  
  // Responsive font sizing with minimum sizes
  const getFontSize = (baseSize) => {
    const scale = Math.min(
      viewport.width / 1280, // base for width
      viewport.height / 800  // base for height
    );
    
    // Ensure fonts don't get too small on mobile
    const minSizes = {
      6: 5.5,    // heading - Further adjusted minSize for desktop hero
      4: 2.5,    // mobile heading
      1.0: 0.75, // New: for larger desktop subheading
      0.9: 0.75, // subheading
      0.8: 0.7,  // paragraph
      0.7: 0.65  // small text
    };
    
    const minSize = minSizes[baseSize] || baseSize * 0.8;
    return `${Math.max(baseSize * scale, minSize)}rem`;
  };
  
  // Responsive spacing
  const getSpacing = (baseSize) => {
    const scale = Math.min(
      viewport.width / 1280,
      viewport.height / 800
    );
    
    return `${Math.max(baseSize * scale, baseSize * 0.6)}rem`;
  };
  
  // Determine if we should use mobile layout
  const isMobile = viewport.width <= 900;
  
  // Handle resize events and initial size
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Make sure we have the right size initially
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Add global style for removing outlines
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      input, input:focus, input:active, input:hover,
      button, button:focus, button:active, button:hover {
        outline: none !important;
        -webkit-focus-ring-color: transparent !important;
        -webkit-tap-highlight-color: transparent !important;
        box-shadow: none !important;
        border-color: #6B7280 !important;
      }
      
      /* Additional reset styles */
      input[type="email"]::-webkit-contacts-auto-fill-button,
      input[type="email"]::-webkit-credentials-auto-fill-button,
      input[type="email"]::-webkit-clear-button {
        visibility: hidden;
        display: none !important;
        pointer-events: none;
        height: 0;
        width: 0;
        margin: 0;
      }
      
      /* Remove blue highlight on Chrome/Safari */
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      input[type="email"]::-webkit-input-placeholder {
        color: #fff;
      }
      input[type="email"]::-moz-placeholder {
        color: #fff;
      }
      input[type="email"]:-ms-input-placeholder {
        color: #fff;
      }
      input[type="email"]::placeholder {
        color: #fff;
      }
      input[type="email"] {
        border-right: none !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Add DOM event listeners to handle focus and blur on input
  useEffect(() => {
    const removeOutline = (e) => {
      e.target.style.outline = 'none';
      e.target.style.boxShadow = 'none';
    };
    
    // Add the event listeners after the component mounts
    setTimeout(() => {
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button');
      
      inputs.forEach(input => {
        input.addEventListener('focus', removeOutline);
        input.addEventListener('blur', removeOutline);
      });
      
      buttons.forEach(button => {
        button.addEventListener('focus', removeOutline);
        button.addEventListener('blur', removeOutline);
      });
    }, 100);
    
    // No cleanup needed since the component will unmount
  }, []);

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let oldX = 0, oldY = 0, deltaX = 0, deltaY = 0
    const handleMouseMove = (e) => {
      deltaX = e.clientX - oldX
      deltaY = e.clientY - oldY
      oldX = e.clientX
      oldY = e.clientY
    }
    root.addEventListener('mousemove', handleMouseMove)
    const mediaEls = root.querySelectorAll('.media')
    const handlers = []
    mediaEls.forEach(el => {
      const handler = () => {
        const image = el.querySelector('img')
        const tl = gsap.timeline({ onComplete: () => { tl.kill() } })
        tl.timeScale(1.2)
        tl.to(image, {
          inertia: {
            x: { velocity: deltaX * 30, end: 0 },
            y: { velocity: deltaY * 30, end: 0 }
          }
        })
        tl.fromTo(image, { rotate: 0 }, {
          duration: 0.4,
          rotate: (Math.random() - 0.5) * 30,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut'
        }, '<')
      }
      el.addEventListener('mouseenter', handler)
      handlers.push([el, handler])
    })
    return () => {
      root.removeEventListener('mousemove', handleMouseMove)
      handlers.forEach(([el, handler]) => {
        el.removeEventListener('mouseenter', handler)
      })
    }
  }, [])

  useEffect(() => {
    if (!window.grained) {
      const script = document.createElement('script')
      script.src = '/grained.min.js'
      script.async = true
      script.onload = () => {
        if (window.grained) {
          window.grained('#grain', {
            animate: true,
            patternWidth: 120,
            patternHeight: 120,
            grainOpacity: 0.08,
            grainDensity: 1,
            grainWidth: 1,
            grainHeight: 1
          })
        }
      }
      document.body.appendChild(script)
    } else {
      const grainEl = document.getElementById('grain')
      if (grainEl) {
        const canvases = document.querySelectorAll('canvas')
        canvases.forEach(c => c.remove())
      }
      window.grained('#grain', {
        animate: false,
        patternWidth: 120,
        patternHeight: 120,
        grainOpacity: 0.08,
        grainDensity: 1,
        grainWidth: 1,
        grainHeight: 1
      })
    }
  }, [])

  const h1TextMobile = [
    'You',
    <span key="img1" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/you_img.png" alt="you" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'vibe-coded',
    <span key="img2" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/coded_img.png" alt="coded" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'it.', <br key="br1" />,
    <span key="img3" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/now_img.png" alt="now" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'Now it needs',
    <span key="img4" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/needs_img.png" alt="needs" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'a real',
    <span key="img5" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/real_img.png" alt="real" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'check.'
  ]
  const h1TextDesktop = [
    'You',
    <span key="img1" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/you_img.png" alt="you" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'vibe-coded',
    <span key="img2" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/coded_img.png" alt="coded" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'it.', <br key="br1" />,
    <span key="img3" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/now_img.png" alt="now" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'Now it needs',
    <span key="img4" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/needs_img.png" alt="needs" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'a real',
    <span key="img5" style={{position:'relative',display:'inline-block'}}><div className="media" style={{zIndex:1000,position:'relative'}}><TrimmedImage src="/images/real_img.png" alt="real" style={{height: '0.65em', verticalAlign: 'middle', display: 'inline-block', margin: '0 0.15em', marginTop: '-0.08em'}} /></div></span>,
    'check.'
  ]
  const h1LetterSpans = (arr) => arr.map((part, i) => {
    if (typeof part === 'string') {
      return <span key={i} className="h1-letter">{part}</span>
    }
    return part
  })

  useEffect(() => {
    const h1 = h1Ref.current;
    if (!h1 || !rootRef.current) return;

    // Create a GSAP context and scope it to the rootRef element
    let ctx = gsap.context(() => {
      gsap.set(h1, { opacity: 1, filter: 'blur(0px)' });

      const allMediaDivs = Array.from(h1.querySelectorAll('.media'));
      const allSuperscripts = Array.from(h1.querySelectorAll('.superscript-animate'));
      gsap.set(allMediaDivs, { opacity: 0, y: 25, filter: 'blur(10px)', scale: 0.85 });
      gsap.set(allSuperscripts, { opacity: 0, y: 10, filter: 'blur(5px)' });

      const subheadElements = Array.from(document.querySelectorAll('.subhead-animate'));
      const emailFieldElement = document.querySelector('.mail-animate');
      const submitButtonElement = document.querySelector('button.no-outline');
      const analyzeElements = Array.from(document.querySelectorAll('.analyze-animate'));

      const elementsToAnimateLater = [
          ...subheadElements,
          emailFieldElement,
          submitButtonElement,
          ...analyzeElements
      ].filter(el => el);
      gsap.set(elementsToAnimateLater, { opacity: 0, y: 30, filter: 'blur(10px)' });

      const tl = gsap.timeline({
          defaults: { duration: 0.8, ease: 'power2.out' },
          delay: 0.5
      });

      const h1Children = Array.from(h1.children);

      h1Children.forEach(child => {
          if (child.classList.contains('h1-letter')) {
              gsap.set(child, { opacity: 1, filter: 'blur(0px)', y: 0 });
              const mySplit = new SplitText(child, { type: 'words' });
              tl.from(mySplit.words, {
                  opacity: 0,
                  y: 20,
                  filter: 'blur(8px)',
                  stagger: 0.1,
                  duration: 0.5
              }, ">-=0.3");
          } else {
              const mediaDiv = child.querySelector('.media');
              const superscriptSpan = child.querySelector('.superscript-animate');

              if (mediaDiv) {
                  tl.to(mediaDiv, {
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                      scale: 1,
                      duration: 0.6
                  }, ">-=0.3");
                  
                  if (superscriptSpan) {
                      tl.to(superscriptSpan, {
                          opacity: 1,
                          y: 0,
                          filter: 'blur(0px)',
                          duration: 0.4
                      }, ">-0.45");
                  }
              } else if (child.tagName === 'BR') {
                  // Optional: tl.addPause("+=0.1");
              }
          }
      });

      if (elementsToAnimateLater.length > 0) {
          tl.to(elementsToAnimateLater, {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              stagger: 0.1,
              duration: 0.7
          }, ">-=0.2");
      }
    }, rootRef.current); // Scope the context to rootRef.current

    return () => {
      ctx.revert(); // Cleanup all GSAP animations and SplitText instances within this context
    };
  }, [isMobile]); // Dependency array remains [isMobile]

  const handleEmailSubmit = async () => {
    if (isSubmitted || !emailValue.trim() || isSubmitting) {
      if (!emailValue.trim()) {
        setSubmissionError('Please enter your email');
        // Optional: Add a shake animation to the input
        const activeInputRef = isMobile ? emailInputMobileRef : emailInputDesktopRef;
        if (activeInputRef.current) {
          gsap.fromTo(activeInputRef.current, 
            { x: -10 }, 
            { x: 10, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" }
          );
        }
        return;
      }
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const response = await fetch(`${API_URL}/api/early-access/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailValue })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success - proceed with animation
        const activeInputRef = isMobile ? emailInputMobileRef : emailInputDesktopRef;
        if (activeInputRef.current) {
          activeInputRef.current.blur();
        }
        setSubmissionText(emailValue);
        setScrambleVisible(true);
      } else {
        // Handle API errors
        setSubmissionError(data.message || 'Something went wrong. Please try again.');
        console.error('Submission failed:', data.message);
      }
    } catch (error) {
      // Handle network errors
      console.error('Network error:', error);
      setSubmissionError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (scrambleVisible && !isSubmitted) {
      const targetOverlayRef = isMobile ? scrambleOverlayMobileRef : scrambleOverlayDesktopRef;

      if (targetOverlayRef.current) {
        // The overlay div is now visible and contains `submissionText` (the email)
        gsap.to(targetOverlayRef.current, {
          duration: 1.5,
          scrambleText: {
            text: "Submitted",
            chars: "lowerCase",
            speed: 0.5,
            revealDelay: 0.2,
            newClass: "scrambled-text" // Optional class for styling during scramble
          },
          onComplete: () => {
            setIsSubmitted(true);
            setSubmissionText("Submitted"); // Keep state consistent with display
          }
        });
      }
    }
  }, [scrambleVisible, isSubmitted, isMobile, submissionText]); // submissionText included for completeness

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission if it were a real form
        handleEmailSubmit();
      }
    };

    const mobileInput = emailInputMobileRef.current;
    const desktopInput = emailInputDesktopRef.current;

    if (isMobile && mobileInput) {
      mobileInput.addEventListener('keydown', handleKeyPress);
    } else if (!isMobile && desktopInput) {
      desktopInput.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      if (mobileInput) {
        mobileInput.removeEventListener('keydown', handleKeyPress);
      }
      if (desktopInput) {
        desktopInput.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [emailValue, isSubmitted, isMobile, isSubmitting]); // Add dependencies

  // Effect to focus the email input on load
  useEffect(() => {
    if (!isSubmitted) {
      const inputToFocusRef = isMobile ? emailInputMobileRef : emailInputDesktopRef;
      if (inputToFocusRef.current) {
        // A small delay can sometimes help ensure the element is fully ready
        setTimeout(() => {
          inputToFocusRef.current.focus();
        }, 100); // Adjust delay if needed, or remove if not necessary
      }
    }
  }, [isMobile, isSubmitted]); // Re-run if layout changes or submission status changes

  // Mobile-only: enforce placeholder font globally
  useEffect(() => {
    if (!isMobile) return;
    const style = document.createElement('style');
    style.id = 'mobile-placeholder-mono-style';
    style.innerHTML = `
      input[type="email"]::placeholder,
      input[type="email"]::-webkit-input-placeholder,
      input[type="email"]::-moz-placeholder,
      input[type="email"]:-ms-input-placeholder {
        font-family: 'Moderat Mono', monospace !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [isMobile]);

  // Clear error message when user starts typing
  useEffect(() => {
    if (submissionError && emailValue) {
      setSubmissionError('');
    }
  }, [emailValue]);

  return (
    <section className="mwg_effect000" ref={rootRef} style={{position:'fixed',top:0,left:0,right:0,bottom:0,width:'100vw',height:'100vh',backgroundColor:'#000',color:'#fff',overflow:'hidden',padding:isMobile?getSpacing(1):getSpacing(2),...resetStyles}}>
      <CustomCursor />
      <div id="grain" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:2}}></div>
      {isMobile ? (
        <div key="mobile-container" style={{background:'#000082',borderRadius:32,boxShadow:'0 4px 32px 0 rgba(0,0,0,0.08)',maxWidth:'100vw',maxHeight:'100vh',height:'calc(100vh - 2vw)',boxSizing:'border-box',margin:'1vw',padding:getSpacing(0.5),position:'relative',display:'flex',flexDirection:'column',overflowY:'auto' /* Added for scrollability if content exceeds viewport */, ...resetStyles}}>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,transform:'scaleY(-1)'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(120% 70% at top, #000082 0%, #000082 40%, #000 100%)',zIndex:1}}></div>
          </div>
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center', // Vertically center content
              minHeight: '100vh', // Ensure full viewport height for vertical centering
              paddingTop: 0, // Remove extra top padding
              paddingRight: getSpacing(2.5),
              paddingBottom: getSpacing(2),
              paddingLeft: getSpacing(2.5),
              width: '100%',
              zIndex: 10,
              ...resetStyles
            }}
          >
            {/* Top Section: Heading */}
            <div style={{ width: '100%', textAlign: 'center', marginBottom: getSpacing(6) /* MOBILE: Padding H1 <-> SubH */ }}>
              <div className="medias" style={{position:'relative'}}>
                <SelectionOverlay targetRef={h1Ref} />
                <h1 
                  ref={h1Ref}
                  style={{ 
                    fontSize: getFontSize(4.5),
                    fontWeight: 400, 
                    lineHeight: 0.9,
                    letterSpacing: '-0.05em',
                    fontFamily: 'Moderat, sans-serif',
                    color: '#fff',
                    margin: 0,
                    padding: 0,
                    textAlign: 'center', 
                    zIndex: 1,
                    position: 'relative',
                    paddingLeft: getSpacing(2),
                    paddingRight: getSpacing(2)
                  }}
                >
                  {h1LetterSpans(h1TextMobile)}
                </h1>
              </div>
            </div>
            
            {/* Bottom Section Wrapper: Subheadings and CTA */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Text section (Subheadings) */}
              <div style={{ marginBottom: getSpacing(2) /* Was 3.5rem */, width: '100%', textAlign: 'center' }}>
                <h2 
                  className="subhead-animate"
                  style={{ 
                    fontFamily: 'Moderat Mono, monospace', 
                    textTransform: 'uppercase', 
                    fontSize: getFontSize(0.8),
                    letterSpacing: '0.03em',
                    margin: 0,
                    marginBottom: getSpacing(1.2), // Constant spacing below first subheading
                    padding: 0,
                    color: '#fff',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    paddingLeft: getSpacing(7.5),
                    paddingRight: getSpacing(7.5)
                  }}
                >
                  IT RUNS. IT LOOKS CLEAN. BUT UNDER THE SURFACE, YOUR APP COULD BE LEAKING DATA, EXPOSING SECRETS, OR SKIPPING CRITICAL CHECKS ONLY A REAL AUDIT WOULD CATCH.
                </h2>
                <div
                  className="analyze-animate"
                  style={{ 
                    fontFamily: 'Moderat Mono, monospace', 
                    textTransform: 'uppercase', 
                    fontWeight: 400, 
                    letterSpacing: '0.03em', 
                    fontSize: getFontSize(0.7),
                    lineHeight: 1.04,
                    margin: 0,
                    padding: 0,
                    color: '#fff',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    paddingLeft: getSpacing(4.5),
                    paddingRight: getSpacing(4.5)
                  }}
                >
                  WE ANALYZE WHAT AI MISSES — BEFORE YOUR CODE REACHES CUSTOMERS.
                </div>
              </div>
              
              {/* CTA Form */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column', 
                  alignItems: 'stretch', 
                  width: '100%',
                  maxWidth: '320px', 
                  margin: '0 auto', 
                  position: 'relative', 
                  gap: getSpacing(0.75) 
                }}
              >
                {!scrambleVisible && !isSubmitted && (
                  <input
                    type="email"
                    required
                    ref={emailInputMobileRef}
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Enter your email"
                    className="no-outline mail-animate"
                    disabled={isSubmitted || isSubmitting}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center', 
                      paddingTop: getSpacing(4), // ACTUAL CHANGE: Increased top padding further
                      paddingRight: getSpacing(1),
                      paddingBottom: getSpacing(2), 
                      paddingLeft: getSpacing(1),
                      height: '56px',
                      width: '100%', 
                      maxWidth: '100%', 
                      fontSize: getFontSize(0.9),
                      backgroundColor: 'transparent',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem',
                      outline: 'none !important',
                      boxShadow: 'none !important',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      textAlign: 'center',
                      lineHeight: 'normal', // ACTUAL CHANGE: Added for better vertical centering
                      boxSizing: 'border-box', // ACTUAL CHANGE: Added for consistent sizing
                      opacity: isSubmitting ? 0.7 : 1,
                      '::placeholder': { color: '#fff', textAlign: 'center', fontFamily: 'Moderat Mono, monospace' },
                      '::-webkit-input-placeholder': { color: '#fff', textAlign: 'center', fontFamily: 'Moderat Mono, monospace' },
                      '::-moz-placeholder': { color: '#fff', textAlign: 'center', opacity: 1, fontFamily: 'Moderat Mono, monospace' },
                      ':-ms-input-placeholder': { color: '#fff', textAlign: 'center', fontFamily: 'Moderat Mono, monospace' }
                    }}
                  />
                )}
                {(scrambleVisible || isSubmitted) && (
                  <div
                    ref={scrambleOverlayMobileRef}
                    className="mail-animate" 
                    style={{
                      fontFamily: 'Moderat Mono, monospace',
                      letterSpacing: '0.02em',
                      height: '48px',
                      width: '100%', 
                      maxWidth: '100%', 
                      fontSize: getFontSize(0.9),
                      color: '#fff',
                      padding: '0.5rem', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center', // Center scrambled text
                      boxSizing: 'border-box',
                      cursor: 'default !important',
                    }}
                  >
                    {submissionText}
                  </div>
                )}
                {submissionError && (
                  <div style={{
                    color: '#ff6b6b',
                    fontSize: getFontSize(0.7),
                    textAlign: 'center',
                    marginTop: '-0.5rem',
                    fontFamily: 'Moderat Mono, monospace',
                  }}>
                    {submissionError}
                  </div>
                )}
                <button
                  type="button" 
                  onClick={handleEmailSubmit}
                  disabled={isSubmitted || isSubmitting}
                  data-cursor-target="join-button"
                  style={{
                    fontFamily: 'Moderat Mono, monospace',
                    width: '100%', 
                    maxWidth: '100%', 
                    borderRadius: 0,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    fontWeight: 400,
                    height: '48px',
                    fontSize: getFontSize(0.9),
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '0', // Adjusted padding as flex will center
                    textAlign: 'center', // Keep for fallback, but flex should dominate
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    display: 'flex', // Added for robust centering
                    alignItems: 'center', // Added for robust centering
                    justifyContent: 'center', // Added for robust centering
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                  className="no-outline"
                  onMouseEnter={() => setButtonHoverMobile(true)}
                  onMouseLeave={() => setButtonHoverMobile(false)}
                >
                  <span>
                    [ <span style={{
                      backgroundColor: !isSubmitted && !isSubmitting && buttonHoverMobile ? '#fff' : 'transparent',
                      color: !isSubmitted && !isSubmitting && buttonHoverMobile ? '#011795' : '#fff',
                      padding: '0.1em 0.5em',
                      borderRadius: 2,
                      transition: 'background 0.15s, color 0.15s',
                      opacity: isSubmitted || isSubmitting ? 0.5 : 1
                    }}>{isSubmitting ? 'submitting...' : 'join early access'}</span> ]
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div key="desktop-container" style={{background:'#000082',borderRadius:32,boxShadow:'0 4px 32px 0 rgba(0,0,0,0.08)',maxWidth:'100vw',maxHeight:'100vh',height:'calc(100vh - 2vw)',boxSizing:'border-box',margin:'1vw',padding:getSpacing(1),position:'relative',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,transform:'scaleY(-1)'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(120% 70% at top, #000082 0%, #000082 40%, #000 100%)',zIndex:1}}></div>
          </div>
          <div 
            style={{
              zIndex: 10,
              width: '100%',
              alignItems: 'flex-start',
              ...resetStyles
            }}
          >
            <div className="medias" style={{position:'relative'}}>
              <SelectionOverlay targetRef={h1Ref} />
              <h1 
                ref={h1Ref}
                style={{ 
                  fontSize: getFontSize(6),
                  fontWeight: 400, 
                  lineHeight: 1.2,
                  letterSpacing: '-0.05em',
                  fontFamily: 'Moderat, sans-serif',
                  color: '#fff',
                  margin: 0,
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                {h1LetterSpans(h1TextDesktop)}
              </h1>
            </div>
          </div>
          
          {/* New Parent Container for Bottom Elements */}
          <div
            style={{
              position: 'absolute',
              bottom: getSpacing(2),
              left: getSpacing(2),
              right: getSpacing(2),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end', // Align items along their bottom edge
              zIndex: 10,
              ...resetStyles
            }}
          >
            {/* Desktop Text - Now a flex item */}
            <div
              style={{
                // maxWidth: '34rem', // REMOVED - width will be fluid
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginRight: getSpacing(1), // Add space between text and CTA
                flexGrow: 1, // Allow text block to take available space
                flexShrink: 1, // Allow text block to shrink
                maxWidth: '55rem', // Added to constrain width
                ...resetStyles
              }}
            >
              <h2 
                className="subhead-animate"
                style={{ 
                  fontFamily: 'Moderat Mono, monospace', 
                  textTransform: 'uppercase', 
                  fontSize: getFontSize(0.8),
                  letterSpacing: '0.03em',
                  margin: 0,
                  marginBottom: getSpacing(1.2), // Constant spacing below first subheading
                  padding: 0,
                  color: '#fff',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  paddingLeft: getSpacing(1.5),
                  paddingRight: getSpacing(1.5)
                }}
              >
                IT RUNS. IT LOOKS CLEAN. BUT UNDER THE SURFACE, YOUR APP COULD BE LEAKING DATA, EXPOSING SECRETS, OR SKIPPING CRITICAL CHECKS ONLY A REAL AUDIT WOULD CATCH.
              </h2>
              <div
                className="analyze-animate"
                style={{ 
                  fontFamily: 'Moderat Mono, monospace', 
                  textTransform: 'uppercase', 
                  fontWeight: 400, 
                  letterSpacing: '0.03em', 
                  fontSize: getFontSize(0.7),
                  lineHeight: 1.04,
                  margin: 0,
                  padding: 0,
                  color: '#fff',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  paddingLeft: getSpacing(1.5),
                  paddingRight: getSpacing(1.5)
                }}
              >
                WE ANALYZE WHAT AI MISSES — BEFORE YOUR CODE REACHES CUSTOMERS.
              </div>
            </div>
            
            {/* Desktop CTA - Now a flex item */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column', // Changed to column to stack error message
                alignItems: 'flex-end',
                flexShrink: 0, // Prevent CTA block itself from shrinking
                flexGrow: 0, // Prevent CTA block itself from growing
                ...resetStyles
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '2px',  // Reduced from 8px
              }}>
                {!scrambleVisible && !isSubmitted && (
                  <input
                    type="email"
                    required
                    ref={emailInputDesktopRef}
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Enter your email"
                    className="no-outline mail-animate"
                    disabled={isSubmitted || isSubmitting}
                    style={{
                      fontFamily: 'Moderat Mono, monospace',
                      borderRadius: 0,
                      letterSpacing: '0.02em',
                      height: '48px',
                      fontSize: '13px', // Fixed pixel font size
                      backgroundColor: 'transparent',
                      color: '#fff',
                      border: 'none',
                      minWidth: '220px', // Reduced from 250px
                      paddingTop: '0.5rem', 
                      paddingRight: '0.25rem', 
                      paddingBottom: '0.5rem',
                      paddingLeft: '1rem',
                      outline: 'none !important',
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      flexGrow: 0, // Prevent growing
                      flexShrink: 0, // Prevent shrinking
                      opacity: isSubmitting ? 0.7 : 1,
                      '::placeholder': { color: '#fff' },
                      '::-webkit-input-placeholder': { color: '#fff' },
                      '::-moz-placeholder': { color: '#fff' },
                      ':-ms-input-placeholder': { color: '#fff' }
                    }}
                  />
                )}
                {(scrambleVisible || isSubmitted) && (
                  <div
                    ref={scrambleOverlayDesktopRef}
                    className="mail-animate" // Keep animation class
                    style={{
                      fontFamily: 'Moderat Mono, monospace',
                      letterSpacing: '0.02em',
                      height: '48px',
                      fontSize: '13px',
                      color: '#fff',
                      minWidth: '220px',
                      paddingTop: '0.5rem', 
                      paddingRight: '0.25rem', 
                      paddingBottom: '0.5rem',
                      paddingLeft: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                      cursor: 'default !important',
                      flexGrow: 0, 
                      flexShrink: 0,
                    }}
                  >
                    {submissionText}
                  </div>
                )}
                <button
                  type="button" // Changed from submit
                  onClick={handleEmailSubmit}
                  disabled={isSubmitted || isSubmitting}
                  data-cursor-target="join-button"
                  style={{
                    fontFamily: 'Moderat Mono, monospace',
                    borderRadius: 0,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    fontWeight: 400,
                    height: '48px',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    paddingTop: '0',
                    paddingRight: '20px',
                    paddingBottom: '0',
                    paddingLeft: '10px',
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    flexGrow: 0,
                    flexShrink: 0,
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                  className="no-outline"
                  onMouseEnter={() => setButtonHoverDesktop(true)}
                  onMouseLeave={() => setButtonHoverDesktop(false)}
                >
                  <span>
                    [ <span style={{
                      backgroundColor: !isSubmitted && !isSubmitting && buttonHoverDesktop ? '#fff' : 'transparent',
                      color: !isSubmitted && !isSubmitting && buttonHoverDesktop ? '#011795' : '#fff',
                      padding: '0.1em 0.5em',
                      borderRadius: 2,
                      transition: 'background 0.15s, color 0.15s',
                      opacity: isSubmitted || isSubmitting ? 0.5 : 1
                    }}>{isSubmitting ? 'submitting...' : 'join early access'}</span> ]
                  </span>
                </button>
              </div>
              {submissionError && (
                <div style={{
                  color: '#ff6b6b',
                  fontSize: '11px',
                  marginTop: '0.5rem',
                  fontFamily: 'Moderat Mono, monospace',
                  textAlign: 'right'
                }}>
                  {submissionError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default App;
