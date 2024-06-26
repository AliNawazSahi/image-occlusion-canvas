document.addEventListener("DOMContentLoaded", function () {

    const imageUpload = document.getElementById("image_upload");
    const occlusionCanvasContainer = document.getElementById("occlusion_canvas_container");
    const occlusionCanvas = document.getElementById("occlusion_canvas");
    const ctx = occlusionCanvas.getContext("2d");

    let isDrawing = false;
    let squares = [];
    let imageData;
    let labelCounter = 65;
    let dragThreshold = 8;
    let draggingThresholdExceeded = false;
    let isDragging = false;
    let dragStartX, dragStartY, draggedRectangleIndex;


    imageUpload.addEventListener("change", handleImageUpload);
    occlusionCanvas.addEventListener("mousedown", startDrawing);
    occlusionCanvas.addEventListener("mousemove", draw);
    occlusionCanvas.addEventListener("mouseup", stopDrawing);
    occlusionCanvas.addEventListener("mousedown", startDragging);
    occlusionCanvas.addEventListener("mousemove", drag);
    occlusionCanvas.addEventListener("mouseup", stopDragging);

    const deleteLabelButton = document.getElementById("deletelabelButton");

    function deleteRectangle(index) {
        // Remove the rectangle at the specified index from the squares array
        squares.splice(index, 1);

        // Clear the canvas and redraw all remaining rectangles and labels
        drawAllLabels();

        // Close the modal
        closeModal();
    }

    let isClickInsideCanvas = false;

    // Add a global click event listener to close the modal when clicking outside
    document.addEventListener("click", function (event) {
        const isClickInsideModal = modal.contains(event.target);

        if (!isClickInsideModal && !isClickInsideCanvas) {
            closeModal();
        }

        // Reset the flag after the click event
        isClickInsideCanvas = false;
    });

    let savedRectanglesData = [];

    // Declare a variable to indicate whether the user is drawing on a new image
    let isNewImage = false;


    // Function to handle image upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;

            document.getElementById("image_hidden_P_tag_for_saving_src").innerText = img.src;

            img.onload = function () {
                document.getElementById("app").style.display = "none";

                occlusionCanvasContainer.style.display = "flex";

                // Calculate aspect ratio
                const aspectRatio = img.width / img.height;

                // Set canvas height to maximum height and adjust width proportionally
                occlusionCanvas.height = occlusionCanvasContainer.clientHeight;
                occlusionCanvas.width = occlusionCanvas.height * aspectRatio;

                // Check if the uploaded image is different from the previous one
                const previousImageData = localStorage.getItem("savedImageData");
                if (previousImageData && previousImageData !== e.target.result) {
                    // Image is different, clear the squares array
                    squares = [];
                }

                // Draw the image for the first time or redraw if necessary
                ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);
                ctx.drawImage(img, 0, 0, occlusionCanvas.width, occlusionCanvas.height);
                imageData = ctx.getImageData(0, 0, occlusionCanvas.width, occlusionCanvas.height);

                // Reset the flag for the next image
                isNewImage = true;
            };
        };

        reader.readAsDataURL(file);
    }


    // Function to draw a rectangle on the canvas
    function drawRectangle(rectangle) {
        ctx.beginPath();
        ctx.rect(rectangle.startX, rectangle.startY, rectangle.endX - rectangle.startX, rectangle.endY - rectangle.startY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = rectangle.color;
        ctx.stroke();
        ctx.fillStyle = rectangle.color;
        ctx.globalAlpha = 0.3; // Set the transparency
        ctx.fillRect(rectangle.startX, rectangle.startY, rectangle.endX - rectangle.startX, rectangle.endY - rectangle.startY);
        ctx.globalAlpha = 1; // Reset the transparency
    }

    // Function to redraw saved rectangles
    function redrawSavedRectangles() {
        // Iterate through saved rectangles data and draw each one
        savedRectanglesData.forEach(drawRectangle);
    }

    // Event listener for the "Save" button
    const saveButton = document.getElementById("save");
    saveButton.addEventListener("click", saveCurrentState);



    // Function to save the current state
    function saveCurrentState() {
        // Save rectangles data and isNewImage flag
        savedRectanglesData = squares.map(rectangle => ({
            startX: rectangle.startX,
            startY: rectangle.startY,
            endX: rectangle.endX,
            endY: rectangle.endY,
            color: rectangle.color,
            label: rectangle.label,
        }));

        const savedImageData = document.getElementById("image_hidden_P_tag_for_saving_src").innerText;
        localStorage.setItem("savedImageData", savedImageData);
        localStorage.setItem("savedRectanglesData", JSON.stringify(savedRectanglesData));
        localStorage.setItem("isNewImage", isNewImage);
        document.getElementById("redraw_previous_image").style.display = "block"

        // Cavas ScreenShot for the redraw Saved -> Image 
        const canvas = document.getElementById("occlusion_canvas");
        const savedRedrawScreenShot = canvas.toDataURL("image/png");
        localStorage.setItem("savedRedrawScreenShot", savedRedrawScreenShot);
        const savedDrawingElementScreenShot = document.getElementById('saved_drawing_screen_shot');
        savedDrawingElementScreenShot.style.display = "block";
        savedDrawingElementScreenShot.style.backgroundImage = `url(${savedRedrawScreenShot})`;
        savedDrawingElementScreenShot.style.backgroundSize = 'contain';
        savedDrawingElementScreenShot.style.backgroundPosition = 'center';
        savedDrawingElementScreenShot.style.backgroundRepeat = 'no-repeat';
    }


    // Function to redraw previous image and rectangles
    function redrawPreviousImage() {
        document.getElementById("app").style.display = "none";
        // Check if there is saved image data
        const savedImageData = localStorage.getItem("savedImageData");

        if (savedImageData) {
            // Clear the canvas before drawing the saved image and rectangles
            ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);

            const img = new Image();
            img.src = savedImageData;

            img.onload = function () {
                occlusionCanvasContainer.style.display = "flex";
    
                // Calculate aspect ratio
                const aspectRatio = img.width / img.height;
    
                // Set canvas height to maximum height and adjust width proportionally
                occlusionCanvas.height = occlusionCanvasContainer.clientHeight;
                occlusionCanvas.width = occlusionCanvas.height * aspectRatio;
    
                // Draw the saved image
                ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);
                ctx.drawImage(img, 0, 0, occlusionCanvas.width, occlusionCanvas.height);
                imageData = ctx.getImageData(0, 0, occlusionCanvas.width, occlusionCanvas.height);
    
                // Clear the squares array before redrawing
                squares = [];
    

                // Retrieve saved rectangles data from localStorage
                const savedRectanglesDataString = localStorage.getItem("savedRectanglesData");
                if (savedRectanglesDataString) {
                    savedRectanglesData = JSON.parse(savedRectanglesDataString);

                    // Redraw saved rectangles
                    redrawSavedRectangles();
                }

                // Allow the user to continue drawing
                isCreating = true;
                activateCreateMode();

                document.getElementById("image_hidden_P_tag_for_saving_src").innerText = localStorage.getItem("savedImageData", savedImageData);
            };
        } else {
            console.log("No previous image data found.");
        }
    }

    // Event listener for the "Redraw Previous Image" button
    const redrawButton = document.getElementById("redraw_previous_image");
    redrawButton.addEventListener("click", redrawPreviousImage);
    document.getElementById('saved_drawing_screen_shot').addEventListener("click", redrawPreviousImage);

    const savedImageData = localStorage.getItem("savedImageData");
    if (!savedImageData) {
        document.getElementById("redraw_previous_image").style.display = "none";
        document.getElementById('saved_drawing_screen_shot').style.display = "none";
    }
    else {
        document.getElementById("redraw_previous_image").style.display = "inline-block"
        // retrieving screenShot of canvas saved drawing
        const savedRedrawScreenShot = localStorage.getItem("savedRedrawScreenShot");
        const savedDrawingElementScreenShot = document.getElementById('saved_drawing_screen_shot');
        savedDrawingElementScreenShot.style.display = "block";
        savedDrawingElementScreenShot.style.backgroundImage = `url(${savedRedrawScreenShot})`;
        savedDrawingElementScreenShot.style.backgroundSize = 'contain';
        savedDrawingElementScreenShot.style.backgroundPosition = 'center';
        savedDrawingElementScreenShot.style.backgroundRepeat = 'no-repeat';
    }



    // Function to redraw saved rectangles
    function redrawSavedRectangles() {
        // Iterate through saved rectangles data and draw each one
        savedRectanglesData.forEach(rectangleData => {
            // Create a new rectangle object using the saved data
            const newRectangle = {
                startX: rectangleData.startX,
                startY: rectangleData.startY,
                endX: rectangleData.endX,
                endY: rectangleData.endY,
                color: rectangleData.color,
                label: rectangleData.label,
                draggable: true, // Set as needed
            };

            // Push the new rectangle into the squares array
            squares.push(newRectangle);

            // Draw the new rectangle
            drawRectangle(newRectangle);
        });
    }




    function startDragging(event) {

        // Check if the click is inside any existing rectangle
        for (let i = 0; i < squares.length; i++) {
            const square = squares[i];
            const minX = Math.min(square.startX, square.endX);
            const maxX = Math.max(square.startX, square.endX);
            const minY = Math.min(square.startY, square.endY);
            const maxY = Math.max(square.startY, square.endY);

            if (startX >= minX && startX <= maxX && startY >= minY && startY <= maxY) {
                isDragging = true;
                dragStartX = event.clientX;
                dragStartY = event.clientY;
                draggedRectangleIndex = i;
                return;
            }
        }
    }

    function drag(event) {
        // closeModal();
        if (isDragging) {
            const deltaX = event.clientX - dragStartX;
            const deltaY = event.clientY - dragStartY;

            squares[draggedRectangleIndex].startX += deltaX;
            squares[draggedRectangleIndex].endX += deltaX;
            squares[draggedRectangleIndex].startY += deltaY;
            squares[draggedRectangleIndex].endY += deltaY;

            dragStartX = event.clientX;
            dragStartY = event.clientY;

            // Redraw all rectangles and labels
            drawAllLabels();

            // Change cursor style to "grab"
            occlusionCanvas.style.cursor = "grab";
        }
    }

    function stopDragging() {
        if (isDragging) {
            isDragging = false;
            occlusionCanvas.style.cursor = "crosshair";
            closeModal();
        }
        drawAllLabels();
    }

    function startDrawing(event) {
        draggingThresholdExceeded = false;
        isDrawing = true;
        enableCheckbox.checked = false;

        const rect = occlusionCanvas.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const scaleX = occlusionCanvas.width / occlusionCanvas.offsetWidth;
        const scaleY = occlusionCanvas.height / occlusionCanvas.offsetHeight;

        startX = (event.clientX - rect.left + scrollX) * scaleX;
        startY = (event.clientY - rect.top + scrollY) * scaleY;

        // Check if the click is inside an existing rectangle or resizing square
        for (let i = 0; i < squares.length; i++) {
            const square = squares[i];
            const minX = Math.min(square.startX, square.endX);
            const maxX = Math.max(square.startX, square.endX);
            const minY = Math.min(square.startY, square.endY);
            const maxY = Math.max(square.startY, square.endY);

            // Check if the click is inside the resizing square
            const squareX = square.startX - 5; // Adjusted for the square size
            const squareY = square.endY - 5; // Adjusted for the square size
            if (
                startX >= squareX &&
                startX <= squareX + 10 &&
                startY >= squareY &&
                startY <= squareY + 10
            ) {
                // If the click is inside a resizing square, do not initiate drawing
                isDrawing = false;
                return;
            }

            if (
                (startX >= minX && startX <= maxX && startY >= minY && startY <= maxY) ||
                (resizingSquareIndex !== -1 &&
                    startX >= square.startX - 5 &&
                    startX <= square.startX + 5 &&
                    startY >= square.endY - 5 &&
                    startY <= square.endY + 5)
            ) {
                // If the click is inside an existing rectangle or resizing square, do not initiate drawing
                isDrawing = false;
                return;
            }
        }

        // Add event listeners for drawing
        occlusionCanvas.addEventListener("mousemove", draw);
        occlusionCanvas.addEventListener("mouseup", stopDrawing);
    }

    // Add an event listener to the enable checkbox
    const enableCheckbox = document.getElementById("enableCheckbox");
    enableCheckbox.addEventListener("change", function () {
        // Check if the checkbox is checked
        const isChecked = enableCheckbox.checked;

        if (isChecked && clickedRectangleIndex !== -1) {
            // If checked and a rectangle is clicked, change the color to #5b5757a3
            squares[clickedRectangleIndex].color = "#5b5757a3";
            drawAllLabels(); // Redraw the canvas with updated color
        } else {
            // If unchecked or no rectangle is clicked, set the color to "#3498db70"
            squares[clickedRectangleIndex].color = "#3498db70";
            drawAllLabels(); // Redraw the canvas with updated color
        }
    });

    function drawRect(startX, startY, endX, endY, index, isCurrentSquare = false) {
        const rectWidth = Math.abs(endX - startX);
        const rectHeight = Math.abs(endY - startY);

        // Check if squares[index] is defined
        if (squares[index]) {

            let fillColor;

            if (isCreating) {
                fillColor = squares[index].color || "#3498db70";
            } else {
                fillColor = squares[index].color || "#0f769d";
            }

            ctx.fillStyle = fillColor;
            ctx.fillRect(Math.min(startX, endX), Math.min(startY, endY), rectWidth, rectHeight);
        }

        // Draw the border of the square
        ctx.strokeStyle = "#5555ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);

        // Calculate the size of the inner square with a maximum size of 45px
        const innerSquareSize = Math.min(50, Math.min(rectWidth, rectHeight));

        // Calculate the position of the inner square
        const innerSquareX = Math.min(startX, endX) + (rectWidth - innerSquareSize) / 2;
        const innerSquareY = Math.min(startY, endY) + (rectHeight - innerSquareSize) / 2;

        // Draw a smaller square inside with a black color
        ctx.fillStyle = "#3498db";
        ctx.fillRect(innerSquareX, innerSquareY, innerSquareSize, innerSquareSize);

        // Label the inner square with letters (A, B, C, ...)
        const label = String.fromCharCode(65 + index); // A is 65 in ASCII
        const labelX = innerSquareX + innerSquareSize / 2;
        const labelY = innerSquareY + innerSquareSize / 2;

        ctx.fillStyle = "white";
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, labelX, labelY);
    }


    function draw(event) {
        if (!isDrawing) return;

        const rect = occlusionCanvas.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const scaleX = occlusionCanvas.width / occlusionCanvas.offsetWidth;
        const scaleY = occlusionCanvas.height / occlusionCanvas.offsetHeight;

        endX = (event.clientX - rect.left + scrollX) * scaleX;
        endY = (event.clientY - rect.top + scrollY) * scaleY;

        // Calculate the drag distances
        const dragX = Math.abs(endX - startX);
        const dragY = Math.abs(endY - startY);

        // Check if the drag distance is less than the threshold on any side
        if (dragX < dragThreshold || dragY < dragThreshold) {
            draggingThresholdExceeded = false;
            return;
        }

        // If the drag distance is greater than the threshold on any side, set the flag
        draggingThresholdExceeded = true;

        // Restore the initial image data
        ctx.putImageData(imageData, 0, 0);

        // Draw all the rectangles
        squares.forEach((square, index) => {
            drawRect(square.startX, square.startY, square.endX, square.endY, index);
        });

        // Draw all the labels
        squares.forEach((square) => {
            if (square.label) {
                drawLabel(square, square.label);
            }
        });

        // Draw the current square on top
        drawRect(startX, startY, endX, endY, squares.length, true);
    }

    let resizingSquareIndex = -1;
    let isResizing = false;
    let resizeStartX, resizeStartY, originalRectDimensions;

    // Add a new function to draw the resizing square
    function drawResizingSquare(rect) {
        const squareSize = 15;
        const squareX = rect.startX - squareSize / 2 - 8;
        const squareY = rect.endY - squareSize / 2 - 7.5;

        ctx.fillStyle = "white"; // Fill with white color
        ctx.fillRect(squareX, squareY, squareSize, squareSize);

        ctx.strokeStyle = "grey"; // Set border color to grey
        ctx.lineWidth = 2; // Set border width
        ctx.strokeRect(squareX, squareY, squareSize, squareSize);
    }

    function drawAllResizingSquares() {
        squares.forEach((square) => {
            drawResizingSquare(square);
        });
        drawAllLabels();
    }

    function drawRectangleBorder(clickedSquare) {
        // Draw a border around the clicked rectangle
        ctx.strokeStyle = "#3498db"; // Red color for the border
        ctx.lineWidth = 2;
        ctx.strokeRect(clickedSquare.startX, clickedSquare.startY, clickedSquare.endX - clickedSquare.startX, clickedSquare.endY - clickedSquare.startY);
    }

    // Add event listeners for resizing
    occlusionCanvas.addEventListener("mousedown", startResizing);
    occlusionCanvas.addEventListener("mousemove", resize);
    occlusionCanvas.addEventListener("mouseup", stopResizing);

    function startResizing(event) {
        closeModal();

        if (!isResizing) {
            const rect = occlusionCanvas.getBoundingClientRect();
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;

            const scaleX = occlusionCanvas.width / occlusionCanvas.offsetWidth;
            const scaleY = occlusionCanvas.height / occlusionCanvas.offsetHeight;

            const mouseX = (event.clientX - rect.left + scrollX) * scaleX;
            const mouseY = (event.clientY - rect.top + scrollY) * scaleY;

            for (let i = 0; i < squares.length; i++) {
                const square = squares[i];
                const expandedRange = 15; // Increase this value to expand the resizing area

                const squareX1 = square.startX - expandedRange;
                const squareY = square.endY - expandedRange;

                // Check if the mouse is inside the bottom-left resizing area
                if (
                    mouseX >= squareX1 &&
                    mouseX <= square.startX &&
                    mouseY >= squareY &&
                    mouseY <= square.endY
                ) {
                    isResizing = true;
                    resizingSquareIndex = i;
                    resizeStartX = event.clientX;
                    resizeStartY = event.clientY;
                    originalRectDimensions = { ...square };
                    break;
                }
            }
        }
    }

    function resize(event) {
        if (isResizing) {
            const deltaX = event.clientX - resizeStartX;
            const deltaY = event.clientY - resizeStartY;

            // Update both startX and endY based on deltaX and deltaY
            squares[resizingSquareIndex].startX = originalRectDimensions.startX + deltaX;
            squares[resizingSquareIndex].endY = originalRectDimensions.endY + deltaY;

            // Redraw all rectangles and labels
            drawAllLabels();
            drawAllResizingSquares();
            isDrawing = false;
            isDragging = false;

            // Change cursor style to "nwse-resize"
            occlusionCanvas.style.cursor = "nwse-resize";
        }
    }

    function stopResizing() {
        closeModal();
        if (isResizing) {
            isResizing = false;
            occlusionCanvas.style.cursor = "crosshair";
        }
        drawAllLabels();
    }

    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;

            // If the drag threshold is not exceeded, do not add the square
            if (!draggingThresholdExceeded) {
                // Add this line to close the modal
                closeModal();
                return;
            }

            // Create a copy of the current square before adding it to the array
            const currentSquare = { startX, startY, endX, endY };

            squares.push(currentSquare); // Save the current square coordinates

            // Remove event listeners for drawing
            occlusionCanvas.removeEventListener("mousemove", draw);
            occlusionCanvas.removeEventListener("mouseup", stopDrawing);

            // Clear the canvas and redraw all the rectangles and labels
            ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);
            imageData && ctx.putImageData(imageData, 0, 0);

            // Draw all the rectangles
            squares.forEach((square, index) => {
                drawRect(square.startX, square.startY, square.endX, square.endY, index);
            });

            // Draw all the labels
            squares.forEach((square) => {
                if (square.label) {
                    drawLabel(square, square.label);
                }
            });

            // Add this line to close the modal
            closeModal();
        }
    }

    occlusionCanvas.addEventListener("click", handleCanvasClick);

    // Get the modal and input elements
    const modal = document.getElementById("modal");
    const frontLabelInput = document.getElementById("frontLabel");
    const backLabelInput = document.getElementById("backLabel");
    const addValueButton = document.getElementById("addValueButton");

    let clickedRectangleIndex = -1; // Initialize with an invalid index


    function handleCanvasClick(event) {
        const rect = occlusionCanvas.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const scaleX = occlusionCanvas.width / occlusionCanvas.offsetWidth;
        const scaleY = occlusionCanvas.height / occlusionCanvas.offsetHeight;

        const clickX = (event.clientX - rect.left + scrollX) * scaleX;
        const clickY = (event.clientY - rect.top + scrollY) * scaleY;

        // Check if the click is within the bounds of any rectangle
        let isClickInsideRectangle = false;
        for (let i = 0; i < squares.length; i++) {
            const square = squares[i];
            const minX = Math.min(square.startX, square.endX);
            const maxX = Math.max(square.startX, square.endX);
            const minY = Math.min(square.startY, square.endY);
            const maxY = Math.max(square.startY, square.endY);

            if (clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY) {
                isClickInsideRectangle = true;

                // Draw the resizing square for the clicked rectangle
                drawResizingSquare(squares[i]);
                drawRectangleBorder(squares[i]);

                clickedRectangleIndex = i;
                openModal(event.clientX, event.clientY, i);
                isClickInsideCanvas = true; // Set the flag to true

                // Retrieve the label values for the clicked rectangle
                const label = squares[i].label;

                // Check if the square has a label before attempting to match
                if (label) {
                    const match = label.match(/^(.*) ➡ (.*)/);

                    // Set the retrieved values in the modal inputs
                    frontLabelInput.value = match ? match[1] : '';
                    backLabelInput.value = match ? match[2] : '';
                } else {
                    // Clear the modal inputs if there is no label
                    frontLabelInput.value = '';
                    backLabelInput.value = '';
                }

                // Update the checkbox based on the color
                if (squares[i].color === "#3498db70") {
                    enableCheckbox.checked = false;
                } else if (squares[i].color === "#5b5757a3") {
                    enableCheckbox.checked = true;
                }

                break;
            }
        }

        // If the click is outside any rectangle, clear the canvas
        if (!isClickInsideRectangle) {
            ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);
            imageData && ctx.putImageData(imageData, 0, 0);

            // Redraw all rectangles
            squares.forEach((square, index) => {
                drawRect(square.startX, square.startY, square.endX, square.endY, index);
            });
            drawAllLabels();
        }
    }

    addValueButton.onclick = function () {
        if (clickedRectangleIndex !== -1) {
            // Get the front and back labels
            const frontLabel = frontLabelInput.value.trim();
            const backLabel = backLabelInput.value.trim();

            // Update the label text for the clicked rectangle
            squares[clickedRectangleIndex].label = `${frontLabel} ➡ ${backLabel}`;

            // Clear the canvas and redraw all rectangles
            ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);
            imageData && ctx.putImageData(imageData, 0, 0);

            squares.forEach((square, index) => {
                drawRect(square.startX, square.startY, square.endX, square.endY, index);
            });

            // Close the modal
            closeModal();

            // Reset the clicked rectangle index
            clickedRectangleIndex = -1;
        }
    };

    // Function to draw all labels on the canvas
    function drawAllLabels() {
        // Clear the canvas and redraw the image
        ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);
        imageData && ctx.putImageData(imageData, 0, 0);

        // Draw all the rectangles
        squares.forEach((square, index) => {
            drawRect(square.startX, square.startY, square.endX, square.endY, index);
        });

        // Draw all the labels
        squares.forEach((square) => {
            if (square.label) {
                drawLabel(square, square.label);
            }
        });
    }

    // Function to draw the label on the canvas
    function drawLabel(square, label) {
        const labelX = Math.min(square.startX, square.endX);
        const labelY = Math.min(square.startY, square.endY) - 18; // Adjust the Y position as needed

        // Set the font size based on the image width
        let fontSize;

        if (occlusionCanvas.height < 500) {
            fontSize = 15; // Smaller font size for very small images
        } else if (occlusionCanvas.height < 1000) {
            fontSize = 17; // Default font size for medium-sized images
        } else if (occlusionCanvas.height < 1600) {
            fontSize = 25; // Default font size for large-sized images
        } else if (occlusionCanvas.height < 2000) {
            fontSize = 27; // Larger font size for very large images
        } else if (occlusionCanvas.height < 2500) {
            fontSize = 30; // Larger font size for very large images
        } else if (occlusionCanvas.height < 3500) {
            fontSize = 40; // Larger font size for very large images
        } else {
            fontSize = 50; // Larger font size for very large images
        }

        ctx.fillStyle = "transparent";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(label, labelX, labelY);


        // Draw the Again Front label to show
        let frontLabel = (label.match(/^(.*?) ➡/) || [])[1].trim();
        frontLabel = frontLabel ? ` ${frontLabel}... ` : frontLabel;

        ctx.fillStyle = "#3498db";  // Background
        ctx.fillRect(labelX, labelY, ctx.measureText(frontLabel).width, fontSize + 5);

        ctx.fillStyle = "white";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(frontLabel, labelX, labelY);

    }

    function openModal(x, y, index) {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Adjust vertically
        if (window.innerHeight - (y - scrollY) <= 100) {
            y -= 100;
        }

        let modalX = x - scrollX;
        let modalY = y - scrollY;

        const modalWidth = modal.offsetWidth;
        const modalHeight = modal.offsetHeight;
        const maxModalY = window.innerHeight - modalHeight;
        const maxModalX = window.innerWidth - modalWidth;

        // Adjust horizontally
        if (window.innerWidth - (x - scrollX) <= 150) {
            modalX -= 200;
        }

        // Ensure the modal is within the viewport vertically
        if (modalY > maxModalY) {
            modalY = maxModalY;
        }

        // Ensure the modal is within the viewport horizontally
        if (modalX > maxModalX) {
            modalX = maxModalX;
        }

        // Set the adjusted modal position
        modal.style.left = `${modalX}px`;
        modal.style.top = `${modalY}px`;


        // Clear previous values from the input fields
        frontLabelInput.value = '';
        backLabelInput.value = '';

        // Display the modal
        modal.style.display = "block";

        // Set the label in the modal based on the rectangle index
        const cardLabel = document.getElementById("card_label");
        cardLabel.innerText = `Card ${String.fromCharCode(65 + index)}`;

        // Handle the "Add Value" button click
        addValueButton.onclick = function () {
            if (clickedRectangleIndex !== -1) {
                // Get the front and back labels
                const frontLabel = frontLabelInput.value.trim();
                const backLabel = backLabelInput.value.trim();

                // Create a label for the clicked rectangle
                const label = `${frontLabel} ➡ ${backLabel}`;

                // Update the label text for the clicked rectangle
                squares[clickedRectangleIndex].label = label;

                // Draw all the labels on the canvas
                drawAllLabels();

                // Close the modal
                closeModal();

                // Reset the clicked rectangle index
                clickedRectangleIndex = -1;
            }
        };

        // Handle the "Delete" button click
        deleteLabelButton.onclick = function () {
            // Call the deleteRectangle function with the current index
            deleteRectangle(index);
        }
    }

    function closeModal() {
        modal.style.display = "none";
    }

    const closeModalBtn = document.getElementById('close_modal_btn')
    closeModalBtn.addEventListener("click", function () {
        closeModal()
    });

    function updateCursorStyle(event) {
        if (isResizing) {
            // Change cursor style to "nwse-resize" when resizing
            occlusionCanvas.style.cursor = "nwse-resize";
            return;
        }

        if (isDragging) {
            // Change cursor style to "grab" when dragging
            occlusionCanvas.style.cursor = "grab";
            return;
        }

        const rect = occlusionCanvas.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const mouseX = (event.clientX - rect.left + scrollX) * (occlusionCanvas.width / occlusionCanvas.offsetWidth);
        const mouseY = (event.clientY - rect.top + scrollY) * (occlusionCanvas.height / occlusionCanvas.offsetHeight);

        let cursorStyle = "crosshair";

        for (let i = 0; i < squares.length; i++) {
            const square = squares[i];
            const minX = Math.min(square.startX, square.endX);
            const maxX = Math.max(square.startX, square.endX);
            const minY = Math.min(square.startY, square.endY);
            const maxY = Math.max(square.startY, square.endY);

            if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
                cursorStyle = "pointer";
                break;
            }
        }

        occlusionCanvas.style.cursor = cursorStyle;
    }
    // Add this line to your existing code to call the function in the appropriate places
    occlusionCanvas.addEventListener("mousemove", updateCursorStyle);

    const createButton = document.getElementById("create");
    const previewButton = document.getElementById("preview");

    let isCreating = true; // Variable to track the mode

    createButton.addEventListener("click", function () {
        isCreating = true;
        activateCreateMode();
    });

    previewButton.addEventListener("click", function () {
        isCreating = false;
        activatePreviewMode();
    });

    function activateCreateMode() {
        occlusionCanvas.addEventListener("mousedown", startDrawing);
        occlusionCanvas.addEventListener("mousemove", draw);
        occlusionCanvas.addEventListener("mouseup", stopDrawing);

        occlusionCanvas.addEventListener("mousedown", startDragging);
        occlusionCanvas.addEventListener("mousemove", drag);
        occlusionCanvas.addEventListener("mouseup", stopDragging);

        occlusionCanvas.addEventListener("mousedown", startResizing);
        occlusionCanvas.addEventListener("mousemove", resize);
        occlusionCanvas.addEventListener("mouseup", stopResizing);
        occlusionCanvas.addEventListener("click", handleCanvasClick);

        occlusionCanvas.addEventListener("mousemove", updateCursorStyle);
        occlusionCanvas.style.cursor = "crosshair";

        const startTest = document.getElementById("start_test");
        startTest.style.display = "none";

        const createButton = document.getElementById("create");
        createButton.style.backgroundColor = "#292936";
        createButton.style.color = "white";

        const previewButton = document.getElementById("preview");
        previewButton.style.backgroundColor = "#8a8a91";
        previewButton.style.color = "black";

        document.getElementById("save").style.display = "block";

        squares.forEach(rectangle => {
            rectangle.draggable = true;
            rectangle.color = (rectangle.color === "#5b5757a3") ? "#5b5757a3" : "#3498db70";
        });
        drawAllLabels();  // Ensure labels are drawn with the updated colors
    }

    function activatePreviewMode() {
        occlusionCanvas.removeEventListener("mousedown", startDrawing);
        occlusionCanvas.removeEventListener("mousemove", draw);
        occlusionCanvas.removeEventListener("mouseup", stopDrawing);

        occlusionCanvas.removeEventListener("mousedown", startDragging);
        occlusionCanvas.removeEventListener("mousemove", drag);
        occlusionCanvas.removeEventListener("mouseup", stopDragging);

        occlusionCanvas.removeEventListener("mousedown", startResizing);
        occlusionCanvas.removeEventListener("mousemove", resize);
        occlusionCanvas.removeEventListener("mouseup", stopResizing);
        occlusionCanvas.removeEventListener("click", handleCanvasClick);

        occlusionCanvas.removeEventListener("mousemove", updateCursorStyle);
        occlusionCanvas.style.cursor = "default";

        const startTest = document.getElementById("start_test");
        startTest.style.display = "block";

        const previewButton = document.getElementById("preview");
        previewButton.style.backgroundColor = "#292936";
        previewButton.style.color = "white";

        const createButton = document.getElementById("create");
        createButton.style.backgroundColor = "#8a8a91";
        createButton.style.color = "black";

        document.getElementById("save").style.display = "none";

        squares.forEach(rectangle => {
            rectangle.draggable = false;
            rectangle.color = (rectangle.color === "#5b5757a3") ? "#5b5757a3" : "#0f769d";
        });

        drawAllLabels();
    }


    const startTestButton = document.getElementById("start_test");
    let correctTestBackLabelInput; // Declare a global variable
    let showAnswerButton; // Declare a global variable for the "Show Answer" button

    startTestButton.addEventListener("click", startTest);

    let rectangleClickListener; // Declare a variable to store the listener
    let testMode = false;
    let currentClickedSquareIndex = -1;

    function startTest() {
        testMode = true
        if (testMode === true) {
            const guess = document.getElementById('guess_me');
            guess.style.display = "block";

            setTimeout(() => {
                guess.style.display = "none";
            }, 1500);
        }
        // Hide the "Start Test" button
        startTestButton.style.display = "none";

        const navbarButtons = document.getElementById("navbar_buttons")
        navbarButtons.style.display = "none";

        const closeButton = document.getElementById("close_button")
        closeButton.style.display = "none";

        const endTest = document.getElementById('end_test')
        endTest.style.display = "block";

        const closeTestModalBtn = document.getElementById('close_test_modal_btn');
        closeTestModalBtn.addEventListener("click", function () {
            document.getElementById('test_modal').style.display = "none";
        });

        // Add an event listener to each drawn rectangle
        squares.forEach((square, index) => {
            const minX = Math.min(square.startX, square.endX);
            const maxX = Math.max(square.startX, square.endX);
            const minY = Math.min(square.startY, square.endY);
            const maxY = Math.max(square.startY, square.endY);

            rectangleClickListener = function (event) {
                const rect = occlusionCanvas.getBoundingClientRect();
                const scaleX = occlusionCanvas.width / occlusionCanvas.offsetWidth;
                const scaleY = occlusionCanvas.height / occlusionCanvas.offsetHeight;
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
                    drawRectangleBorder(squares[index]);
                    currentClickedSquareIndex = index;
                    // Show the test_modal when a rectangle is clicked
                    const testModal = document.getElementById("test_modal");
                    testModal.style.display = testMode ? "block" : "none"
                    document.getElementById("testBackLabel").value = "";

                    // Insert the value of the back label into the hidden input
                    correctTestBackLabelInput = document.getElementById("correctTestBackLabel");
                    correctTestBackLabelInput.style.display = "none"
                    correctTestBackLabelInput.style.backgroundColor = "#5f5f6794";
                    correctTestBackLabelInput.value = ""

                    // Check if square.label is defined and has the expected format
                    if (!square.label || square.label === " ➡ ") {
                        correctTestBackLabelInput.value = "This card is Empty";
                    } else {
                        const labelParts = square.label.split(" ➡ ");
                        if (labelParts.length === 2 && labelParts[1].trim() !== "") {
                            correctTestBackLabelInput.value = "Correct Answer :  " + labelParts[1].trim();
                        } else {
                            correctTestBackLabelInput.value = "This card is Empty";
                        }
                    }
                    document.querySelector(`label[for="testBackLabel"]`).style.display = 'inline-block'
                    document.getElementById("label_result_container").style.display = 'none';
                    // Set the "correct" and "incorrect" radio inputs as unchecked
                    document.getElementById("correct_answer").checked = false;
                    document.getElementById("incorrect_answer").checked = false;

                    // Add event listener to the "Show Answer" button
                    showAnswerButton = document.getElementById("show_answer");
                    showAnswerButton.addEventListener("click", showAnswerHandler);

                }
            };
            occlusionCanvas.addEventListener("click", rectangleClickListener);
        });
    }

    const showAnswerHandler = function () {

        // Get user's input from the testBackLabel input field
        const userBackLabelInput = document.getElementById("testBackLabel").value;

        if (correctTestBackLabelInput.value === "This card is Empty") {
            correctTestBackLabelInput.style.width = "24%";
            document.getElementById("label_result_container").style.display = 'none';
            
        } else {
            correctTestBackLabelInput.style.width = "98%";
            document.getElementById("label_result_container").style.display = 'inline-block';
            document.querySelectorAll("#label_result_container label").forEach(label => {
                label.style.display = 'inline-block';
            });
            document.getElementById("correct_answer").disabled = false;
            document.querySelector(`label[for="correct_answer"]`).style.backgroundColor = '#3aac2e';
            document.getElementById("incorrect_answer").disabled = false;
            document.querySelector(`label[for="incorrect_answer"]`).style.backgroundColor = '#dd2525';
        }

        // Find the corresponding square and change its color to transparent
        const matchingSquare = squares[currentClickedSquareIndex];
        if (matchingSquare) {
            matchingSquare.color = "transparent";
            drawAllLabels(); // Update the canvas with the new color
        }

        correctTestBackLabelInput.style.display = "block";
        document.querySelector(`label[for="testBackLabel"]`).style.display = 'none'

        // Adding the animation
        correctTestBackLabelInput.classList.add("animate__flash");

        // Remove the "animate__flash" class after 3 seconds
        setTimeout(() => {
            correctTestBackLabelInput.classList.remove("animate__flash");
        }, 3000);
    };

// Add event listener to each radio button
const answerRadioButtons = document.querySelectorAll('input[name="answer"]');
answerRadioButtons.forEach(button => {
    button.addEventListener("change", handleRadioButtonChange);
});

function handleRadioButtonChange(event) {
    // document.querySelector(`label[for="testBackLabel"]`).style.display = 'inline-block';
    const selectedAnswerRadioValue = event.target.value;
    console.log("Card", String.fromCharCode(65 + currentClickedSquareIndex), "is", selectedAnswerRadioValue);

    // document.getElementById("question_label_result_container").style.display = "none"
    // Disable the unselected radio button and set background color for labels
    const otherAnswerRadioButtons = document.querySelectorAll('input[name="answer"]:not(:checked)');
    otherAnswerRadioButtons.forEach(button => {
        button.disabled = true;

        // Set background color for labels based on the selected radio button
        const labelForButton = document.querySelector(`label[for="${button.id}"]`);
        if (button.value === 'correct') {
            labelForButton.style.backgroundColor = '#415641';
        } else {
            labelForButton.style.backgroundColor = '#4e3e3e';
        }
    });
}





    const endTestButton = document.getElementById("end_test");
    endTestButton.addEventListener("click", endTest);

    function endTest() {
        testMode = false
        isCreating = true;
        activateCreateMode();

        const guess = document.getElementById('guess_me')
        guess.style.display = "none";

        const navbarButtons = document.getElementById("navbar_buttons")
        navbarButtons.style.display = "flex";

        const closeButton = document.getElementById("close_button")
        closeButton.style.display = "block";

        const endTest = document.getElementById('end_test')
        endTest.style.display = "none";

        const testModal = document.getElementById("test_modal");
        testModal.style.display = "none";

    }

    // Function to reset the canvas and squares
    function resetCanvas() {
        squares = [];
        labelCounter = 65; // Reset the label counter to 'A'

        // Clear the canvas
        ctx.clearRect(0, 0, occlusionCanvas.width, occlusionCanvas.height);

        // Hide the canvas container
        occlusionCanvasContainer.style.display = "none";

        // Show the app div
        document.getElementById("app").style.display = "flex";
        // Empty the image upload
        document.getElementById("image_upload").value = '';

        // Reset the flag for the next image (if applicable)
        isNewImage = true;
    }

    // Get the close button element
    const closeButton = document.getElementById("close_button");

    // Add a click event listener to the close button
    closeButton.addEventListener("click", function () {
        isCreating = true;
        activateCreateMode();
        resetCanvas();
        document.getElementById("image_upload").value = '';
    });

    // Function to close the canvas
    window.closeCanvas = function () {
        resetCanvas();
    };
});
