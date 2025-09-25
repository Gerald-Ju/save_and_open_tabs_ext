var result = document.getElementById("result")

document.getElementById("fileElem").addEventListener("change", e => {
    console.log("=== File input changed ===");
        const file = e.target.files[0];
        
        if (!file) {
            console.log("No file selected");
            return;
        }
        
        console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            console.log("File read successfully, content length:", event.target.result.length);
            try {
                processFileContent(event.target.result, file.name);
            } catch (error) {
                console.error("Error processing file content:", error);
                result.innerText = `Error processing file: ${error.message}`;
            }
        };
        
        console.log("Starting to read file as text");
        reader.readAsText(file);
    });

function processFileContent(content, filename) {
    console.log("=== processFileContent called ===", filename);
    let urls = [];
    
    try {
        if (filename.toLowerCase().endsWith('.json')) {
            console.log("Processing JSON file");
            const data = JSON.parse(content);
            console.log("Parsed JSON data structure:", Object.keys(data));
            
            if (data.tabs && Array.isArray(data.tabs)) {
                console.log("Found tabs array with", data.tabs.length, "items");
                urls = data.tabs
                    .map(tab => tab.url)
                    .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
            } else {
                console.error("Invalid JSON structure:", data);
                throw new Error('Invalid JSON format - no tabs array found');
            }
            
        } else if (filename.toLowerCase().endsWith('.txt')) {
            console.log("Processing TXT file");
            const lines = content.split('\n');
            console.log("File has", lines.length, "lines");
            
            urls = lines
                .map(line => line.trim()) // Clean up each line
                .filter(line => {
                    // Accept any line that looks like a URL
                    return line && (
                        line.startsWith('http://') || 
                        line.startsWith('https://') ||
                        line.startsWith('file://') ||
                        line.startsWith('ftp://')
                    );
                })
                .filter(url => url.length > 0); // Remove empty strings
                
        } else {
            throw new Error('Unsupported file type. Please use .txt or .json files.');
        }

        console.log("Extracted URLs:", urls);
        
        if (urls.length === 0) {
            console.log("No valid URLs found in file");
            result.innerText = 'No valid URLs found in the file';
            return;
        }
        
        // Show confirmation
        const confirmMsg = `Found ${urls.length} URLs. Open them in a new window?`;
        console.log("Showing confirmation dialog");
        
        if (!confirm(confirmMsg)) {
            console.log("User cancelled");
            return;
        }
        
        console.log("User confirmed, opening URLs");
        createNewWindow(urls);
        
    } catch (error) {
        console.error("File processing error:", error);
        result.innerText = `Error processing file: ${error.message}`;
    }
}

function createNewWindow(urls) {
    console.log("=== createNewWindow called ===", urls.length);
    
    if (document.getElementById("check-incognito").checked)
    {
        // Create window with first URL
        var windowOptions = {
            url: urls[0],
            focused: true,
            incognito: true,
            type: "normal"
        };
    } else {
        windowOptions = {
            url: urls[0],
            focused: true,
            type: "normal"
        }
    }

    browser.windows.create(windowOptions, function(newWindow) {
        console.log("browser.windows.create callback executed");
        
        if (browser.runtime.lastError) {
            console.error("Error creating window:", browser.runtime.lastError);
            result.innerText = `Error creating new window: ${browser.runtime.lastError.message}`;
            return;
        }
        
        if (!newWindow) {
            console.error("New window object is null/undefined");
            result.innerText = "Failed to create new window";
            return;
        }
        
        console.log("New window created successfully, ID:", newWindow.id);
        
        if (urls.length === 1) {
            console.log("Single URL opened successfully");
            result.innerText = "Tab opened successfully!";
            window.close();
            return;
        }
        
        // // Add remaining URLs as tabs
        // let tabsCreated = 1;
        // let errors = 0;
        
        // for (let i = 1; i < urls.length; i++) {
        //     console.log("Creating tab", i + 1, "with URL:", urls[i]);
            
        //     browser.tabs.create({
        //         windowId: newWindow.id,
        //         url: urls[i],
        //         active: false
        //     }, function(tab) {
        //         console.log(`Tab creation callback for tab ${i + 1}`);
        //         tabsCreated++;
                
        //         if (browser.runtime.lastError) {
        //             console.error(`Error creating tab ${i + 1}:`, browser.runtime.lastError);
        //             errors++;
        //         } else {
        //             console.log(`Tab ${i + 1} created successfully:`, tab ? tab.id : 'no tab object');
        //         }
                
        //         // Check if all tabs are processed
        //         if (tabsCreated === urls.length) {
        //             const successCount = urls.length - errors;
        //             console.log(`Process complete: ${successCount} out of ${urls.length} tabs opened`);
        //             alert(`Opened ${successCount} out of ${urls.length} tabs in new window`);
        //             window.close();
        //         }
        //     });
        // }

        // Track results for detailed reporting
        let tabsCreated = 1; // First tab already created with window
        let successfulUrls = [urls[0]]; // First URL assumed successful since window was created
        let failedUrls = [];
        
        for (let i = 1; i < urls.length; i++) {
            console.log("Creating tab", i + 1, "with URL:", urls[i]);
            
            browser.tabs.create({
                windowId: newWindow.id,
                url: urls[i],
                active: false
            }, function(tab) {
                console.log(`Tab creation callback for tab ${i + 1}`);
                tabsCreated++;
                
                if (browser.runtime.lastError) {
                    console.error(`Error creating tab ${i + 1}:`, browser.runtime.lastError);
                    failedUrls.push({
                        url: urls[i],
                        error: browser.runtime.lastError.message
                    });
                } else {
                    console.log(`Tab ${i + 1} created successfully:`, tab ? tab.id : 'no tab object');
                    successfulUrls.push(urls[i]);
                }
                
                // Check if all tabs are processed
                if (tabsCreated === urls.length) {
                    const successCount = successfulUrls.length;
                    const failureCount = failedUrls.length;
                    
                    console.log(`Process complete: ${successCount} successful, ${failureCount} failed`);
                    console.log("Successful URLs:", successfulUrls);
                    console.log("Failed URLs:", failedUrls);
                    
                    // Create detailed message
                    let message = `Opened ${successCount} out of ${urls.length} tabs in new window`;
                    
                    if (failureCount > 0) {
                        message += `\n\nFailed to open ${failureCount} URL(s):`;
                        failedUrls.forEach((failed, index) => {
                            const shortUrl = failed.url.length > 50 ? 
                                failed.url.substring(0, 50) + '...' : 
                                failed.url;
                            message += `\n${index + 1}. ${shortUrl}`;
                            message += `\n   Error: ${failed.error}`;
                        });
                    }
                    
                    result.innerText = message
                }
            });
        }
    });
}