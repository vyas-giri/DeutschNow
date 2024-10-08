"use client";
import { checkDialogues1, checkDialogues2, checkDialogues3, dialogues1, dialogues2, dialogues3 } from "@/utils/dialogues";
import levenshtein from "js-levenshtein";
import Image from "next/image";
import Link from "next/link";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import React, {useEffect, useState, useRef} from "react";


export default function Page({ params }) {
  const [dialogues, setDialogues] = useState([]);
  const [checkDialogues, setCheckDialogues] = useState(checkDialogues1);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(-1);
  const [userSpeech, setUserSpeech] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const lastTextRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [allowContinue, setAllowContinue] = useState(false);
  const scrollableSectionRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [highlightedSpeech, setHighlightedSpeech] = useState(``);
  // const [userVoice, setUserVoice] = useState()
  const threshold = 3;
  const slug = params.slug
  useEffect(() => {
    if (slug === "scenario1") {
      setDialogues(dialogues1)
      setCheckDialogues(checkDialogues1)
    }
    else if (slug === "scenario2") {
      setDialogues(dialogues2)
      setCheckDialogues(checkDialogues2)
    }
    else if (slug === "scenario3") {
      setDialogues(dialogues3)
      setCheckDialogues(checkDialogues3)
    }
  }, [slug])

    useEffect(() => {
      // This ensures the code runs only on the client side
      setIsClient(true);
  }, []);

    // Scroll to the last seller dialogue when the "Continue" button is pressed
    useEffect(() => {
      if (lastTextRef.current) {
          lastTextRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [currentDialogueIndex]);

  const handleSpeak = (text) => {
    if (!text) {
      alert('Please enter some text');
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const germanVoices = voices.filter(voice => voice.lang.startsWith('de'));

    // Create a new SpeechSynthesisUtterance instance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = dialogues[currentDialogueIndex + 1][0] === "Seller" ? "de-CH" : "de-AT";

    // Set up event listeners to monitor speech progress
    utterance.onstart = () => {
      setSpeaking(true);
      console.log('Speech started');
    };

    utterance.onend = () => {
      setSpeaking(false);
      console.log('Speech finished');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setSpeaking(false);
    };

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };


    const startRecognition = () => {
      if (!isClient) return;
      enqueueSnackbar("Listening...", {
        variant: "info",
        hideIconVariant: true,
        autoHideDuration: 2000,
      })
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'de-DE';

      recognition.onresult = function(event) {
          const speechResult = event.results[0][0].transcript;
          setUserSpeech(speechResult);
          console.log(speechResult.trim().toLowerCase(), checkDialogues[currentDialogueIndex][1].toLowerCase())

          if (checkDialogue(speechResult.trim().toLowerCase(), checkDialogues[currentDialogueIndex][1].toLowerCase())) {
              setIsCorrect(true);
              setAllowContinue(true);
              playAudio("/audios/success.mp3")
              enqueueSnackbar('Correct!', {
                autoHideDuration: 2000,
                variant: 'success',
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'right'
                }
                })
          } else {
              setIsCorrect(false);
              playAudio("/audios/failure.mp3")
              enqueueSnackbar('Try again!', {
                autoHideDuration: 2000,
                variant: 'error',
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'right'
                }
              })
          }
      };
      recognition.start();
      
  };

  function highlightDifferences(original, detected) {
    const maxLength = Math.max(original.length, detected.length);
    console.log(original, detected)

    let highlighted = ``;

    for (let i = 0; i < maxLength; i++) {
      if (original[i] == detected[i]) {
        highlighted += detected[i]
      }
      else {
        highlighted += `<span class="text-red-500">${original[i]}</span>`
      }
    }
    console.log(highlighted)

    return highlighted;
}

    const playAudio = (audioSrc) => {
      const audio = new Audio(audioSrc);
      audio.play();
    };

    const checkDialogue = (speechResult, expectedDialogue) => {
        const distance = levenshtein(speechResult, expectedDialogue);

        // if (currentDialogueIndex >= 0) {
        //   setHighlightedSpeech(highlightDifferences(checkDialogues[currentDialogueIndex][1].toLowerCase(), userSpeech.trim().toLowerCase()))
        // }
        // console.log(highlightedSpeech)
        // if (highlightedSpeech !== "") {
        //   document.getElementById("output").innerHTML = highlightedSpeech;
        // }

        if (distance <= threshold) {
            return true; // Accept the response
        } else {
            return false; // Ask the user to try again
        }
    };

    const proceedToNext = () => {
      if (currentDialogueIndex < dialogues.length - 1) {
          // Advance to the next seller's dialogue
          setCurrentDialogueIndex(currentDialogueIndex + 1);
          setIsCorrect(false);
          setUserSpeech("");
          setAllowContinue(false);
          handleSpeak(dialogues[currentDialogueIndex + 1][1])
          // playAudio(dialogues[currentDialogueIndex + 1][2])
          // scrollToElement();
      }
  };


  return (
    <main className="bg-white py-1 xl:py-3 h-screen text-black overflow-x-hidden">
      <SnackbarProvider dense />
      <div className="w-full flex flex-col space-y-1 lg:space-y-2 xl:space-y-3 items-center justify-center">
        <Link href={"/"}><span className="text-[#036A8C] font-extrabold text-lg md:text-xl xl:text-2xl">DeutschNow</span></Link>
        <div className={`${slug === "scenario1" && "bg-[url('/banner1.jpeg')]"} ${slug === "scenario2" && "bg-[url('/banner2.jpeg')]"} ${slug === "scenario3" && "bg-[url('/banner3.jpeg')]"} h-56 !mb-2 sm:h-64 lg:h-72 w-screen bg-center md:bg-center bg-cover bg-no-repeat md:bg-fixed`}></div>
        <div className="w-[90%] !mt-2 sm:w-[80%] md:w-[70%] flex flex-col items-center justify-center shadow-[#00000017] shadow-lg drop-shadow-lg rounded-lg">
          <div className="bg-[#036A8C] text-white text-xs sm:text-base rounded-t-lg px-3 py-1 xl:p-3 w-full lg:text-lg z-10">
            {slug === "scenario1" && <span>Buying a Train Ticket in Germany</span>}
            {slug === "scenario2" && <span>Going Through Immigration in Germany</span>}
            {slug === "scenario3" && <span>Handling Lost Luggage at the Airport</span>}
          </div>
          {/* <button onClick={handleSpeak}>Speak</button> */}
          <div className="overflow-y-scroll w-full space-y-3 rounded-2xl p-3 h-60 sm:h-52 md:h-48 xl:h-60" ref={scrollableSectionRef}>
            {currentDialogueIndex < 0 && <div className="flex flex-col space-y-2 items-center justify-center w-full h-full">
              <button onClick={proceedToNext} className="bg-green-500 rounded-3xl py-2 px-4 text-white">Start</button>
              <span className="max-w-[80%] text-center text-sm sm:text-base">
                Practice speaking German with real life scenarios. Speak your lines to keep the conversation going.
              </span>
            </div>}
                {dialogues.slice(0, currentDialogueIndex + 1).map((dialogue, index) => (
                    <div 
                        key={index} 
                        className={`w-full flex items-center justify-end`}
                        // ref={dialogue[0] === "Seller" && index === currentDialogueIndex ? lastSellerRef : null}
                    >
                      <div className={`w-full flex items-center hello justify-${dialogue[0] === "Seller" ? "start" : "end"}`}>
                        <div className={`flex items-center justify-center space-x-2`}>
                            <Image 
                                src={dialogue[0] === "Seller" ? "/man1.png" : "/man2.png"} 
                                alt="person" 
                                width={30} 
                                height={20} 
                                unoptimized 
                                className="w-7 sm:w-9" 
                            />
                            <div className={`flex flex-col items-center justify-center space-y-1 rounded-lg p-1 sm:px-3 ${dialogue[0] === "Seller" && "bg-[#efefef]"} ${dialogue[0] === "You" && "bg-[#036A8C1A]"} ${index === currentDialogueIndex && dialogue[0] === "You" && userSpeech && !isCorrect && "bg-[#FEDFDF]"}`}>
                              <div className="flex items-center justify-center space-x-2">
                                <button disabled={speaking} onClick={() => {
                                  handleSpeak(dialogue[1])
                                }}>
                                  <Image 
                                      src="/speakButton.png" 
                                      alt="speak" 
                                      width={15} 
                                      height={10} 
                                      className="w-3 sm:w-4" 
                                  />
                                </button>
                                <span className="text-xs sm:text-base lg:text-lg">{dialogue[1]}</span>
                              </div>
                              <span className="text-[10px] sm:text-sm text-center">{dialogue[2]}</span>
                              {currentDialogueIndex < dialogues.length && dialogue[0] === "You" && index === currentDialogueIndex && (
                <div className="user-input flex items-center justify-center flex-col space-y-1">
                  {userSpeech !== "" && isCorrect ? null : <button onClick={startRecognition} className="rounded-3xl p-2 px-4 bg-[#036A8C] text-white flex items-center justify-center space-x-2 text-xs">
                      <Image src={"/microphone.png"} alt="speak" width={13} height={12} />
                      <span className="text-[11px] sm:text-sm lg:text-base">
                        {userSpeech === "" && "Speak"}
                        {userSpeech !== "" && !isCorrect && "Speak Again"}
                      </span>
                  </button>}
                  <p className="text-xs sm:text-sm">{userSpeech ? `Detected speech: ${userSpeech}` : ""}</p>
                  {/* {userSpeech !== "" && isCorrect ? <p>✅ Correct</p> : <p>❌ Try Again</p>} */}
                </div>
            )}
                            </div>
                        </div>
                        </div>
                    </div>
                ))}
                <div ref={lastTextRef} />  
            </div>

            {currentDialogueIndex > 0 && currentDialogueIndex > dialogues.length - 2 && <span className="px-3 py-1 sm:py-2 text-green-500 text-center text-[10px] sm:text-xs md:text-sm border-t border-green-500">Success!!!<br/>You&apos;ve practiced your speaking skills at {slug === "scenario1" && "a metro/railway station."} {slug === "scenario2" && "an airport."} {slug === "scenario3" && "an airport."} You&apos;re now better equipped to handle {slug === "scenario1" && "enquiring for train tickets in german."} {slug === "scenario2" && "immigration process in german."} {slug === "scenario3" && "lost luggage search at an airport in german."}</span>}
            
          {currentDialogueIndex > -1 && currentDialogueIndex < dialogues.length - 1 && 
          <div className="border-t border-[#D9D9D9] w-full flex items-center justify-center z-10 py-2">
            {/* <button>Continue</button> */}
            {/* dialogues[currentDialogueIndex][0] === "You" &&  */}
            {dialogues[currentDialogueIndex][0] === "You" ? <button onClick={proceedToNext} className={`${allowContinue ? "bg-[#036A8C] text-white" : "bg-[#CACACA] text-[#9F9F9F]"} p-1 sm:p-3 flex items-center justify-center space-x-1 sm:space-x-2 rounded-3xl text-xs sm:text-sm md:text-base`} disabled={!allowContinue}>
              <Image src={allowContinue ? "/continue.png" : "/continueBlack.png"} alt="continue" width={20} height={20} className="w-4" />
              <span>Continue</span>
            </button>
            :
            <button className="bg-[#036A8C] text-white p-1 sm:p-3 flex items-center justify-center space-x-1 sm:space-x-2 rounded-3xl text-xs sm:text-sm md:text-base" onClick={proceedToNext}>
              <Image src={"/continue.png"} alt="continue" width={20} height={20} className="w-4" />
              <span>Continue</span>
            </button>}
          </div>}
        </div>
      </div>
    </main>
  );
}
