document.addEventListener('DOMContentLoaded', function() {   
    try {
        // Check if buttons exist
        const buttons = document.querySelectorAll('button');
        console.log("Found buttons:", buttons.length);
        
        buttons.forEach((button, index) => {
            console.log(`Button ${index}:`, button.textContent.trim(), button.id);
            
            button.addEventListener('click', function() {
                console.log("=== BUTTON CLICKED ===", button.textContent.trim());
                
                try {
                    const buttonText = button.textContent.trim();
                    
                    if (buttonText === "Save as Text File") {
                        console.log("Calling saveAsTextFile");
                        saveAsTextFile();
                    } else if (buttonText === "Save as Json File") {
                        console.log("Calling saveAsJsonFile");
                        saveAsJsonFile();
                    } else if (buttonText === "Open File") {
                        console.log("Calling openFile");
                        browser.windows.create({
                            url: browser.runtime.getURL("popup/restore.html"),
                            type: "popup",
                            width: 400,
                            height: 300
                        });
                    }
                } catch (e) {
                    console.error("Error in button click handler:", e);
                    alert("Error: " + e.message);
                }
            });
        });
        
        console.log("All event listeners added successfully");
        
    } catch (e) {
        console.error("Error in DOMContentLoaded:", e);
        alert("Error in DOMContentLoaded: " + e.message);
    }
});

function saveAsTextFile() {
    console.log("=== saveAsTextFile called ===");
    
    if (!browser.tabs) {
        console.error("browser.tabs not available");
        alert("browser.tabs not available - check permissions");
        return;
    }
    
    browser.tabs.query({currentWindow: true}, function(tabs) {
        console.log("browser.tabs.query callback executed");
        
        if (browser.runtime.lastError) {
            console.error("Error getting tabs:", browser.runtime.lastError);
            alert("Error getting tabs: " + browser.runtime.lastError.message);
            return;
        }
        
        console.log("Got tabs:", tabs.length);
        
        // Create text content
        let textContent = `Tabs in Current Window (${tabs.length} total):\n\n`;
        tabs.forEach((tab, index) => {
            textContent += `${index + 1}. ${tab.title}\n${tab.url}\n\n`;
        });

        // let textContent = "";
        // tabs.forEach((tab, index) => {
        //     textContent += `${tab.url}\n`;
        // });
        
        console.log("Text content created, length:", textContent.length);
        
        // Download the file
        downloadFile(textContent, 'text/plain', 'txt');
    });
}

function saveAsJsonFile() {
    console.log("=== saveAsJsonFile called ===");
    
    if (typeof browser === 'undefined') {
        console.error("Browser APIs not available");
        alert("Browser APIs not available");
        return;
    }
    
    browser.tabs.query({currentWindow: true}, function(tabs) {
        if (browser.runtime.lastError) {
            console.error("Error getting tabs:", browser.runtime.lastError);
            alert("Error getting tabs: " + browser.runtime.lastError.message);
            return;
        }
        
        console.log("Got tabs for JSON:", tabs.length);
        
        // Create JSON data
        const tabsData = {
            timestamp: new Date().toISOString(),
            windowId: tabs[0]?.windowId,
            totalTabs: tabs.length,
            tabs: tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                url: tab.url,
                active: tab.active,
                pinned: tab.pinned,
                index: tab.index
            }))
        };
        
        console.log("JSON data created");
        
        // Download the file
        downloadFile(JSON.stringify(tabsData, null, 2), 'application/json', 'json');
    });
}

function downloadFile(content, mimeType, extension) {
    console.log("=== downloadFile called ===", mimeType, extension);
    
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser-tabs-${new Date().toISOString().split('T')[0]}.${extension}`;
        
        console.log("Download link created:", a.download);
        
        document.body.appendChild(a);      
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        console.log("Object URL revoked");

        alert(`${extension.toUpperCase()} file saved successfully!`);
        
    } catch (error) {
        console.error("Download error:", error);
        alert("Error creating file: " + error.message);
    }
}