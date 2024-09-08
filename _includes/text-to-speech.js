document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("text-to-speech-btn");

    // Function to read the text on the page
    function readAloud() {
        const content = document.body.innerText; // Get all text from the body
        const speech = new SpeechSynthesisUtterance(content); // Create speech object
        speech.lang = 'en-US'; // You can set the language
        speech.rate = 1; // Adjust the speed of speech (1 is normal speed)

        // Get available voices
        const voices = window.speechSynthesis.getVoices();

        // Find a more natural-sounding voice (try using 'Google US English' or 'Microsoft David Desktop - English')
        const selectedVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Microsoft David'));

        // If a preferred voice is found, set it
        if (selectedVoice) {
            speech.voice = selectedVoice;
        }

        // Speak the content
        window.speechSynthesis.speak(speech);
    }

    // Add event listener to the button
    button.addEventListener("click", readAloud);

    // Fetch the voices list as it's not always available immediately on some browsers
    window.speechSynthesis.onvoiceschanged = function() {
        const voices = window.speechSynthesis.getVoices();
    };
});
