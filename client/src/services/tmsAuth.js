import axios from "axios";

export const ensureTmsAuthenticated = async () => {
    console.log("Performing dynamic auto-login to TMS post-extraction...");
    try {
        const response = await axios.post("https://tms.traanslogsinnovation.com/authentication", {
            mobileNumber: "9658947277",
            password: "Garg@1234",
            strategy: "local",
            organizationId: "6895b6269bb6e4001c31dfc4",
            location: {
                latitude: 20.349393,
                longitude: 85.8078099
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*"
            }
        });

        if (response.data && response.data.accessToken) {
            localStorage.setItem("tms_token", response.data.accessToken);
            localStorage.setItem("tms_org_id", "6895b6269bb6e4001c31dfc4");
            console.log("Dynamic TMS auto-login successful post-extraction.");
            return response.data.accessToken;
        }
    } catch (err) {
        console.error("Dynamic TMS auto-login failed:", err);
    }
    return null;
};
