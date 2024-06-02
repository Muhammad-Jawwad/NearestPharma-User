import React, { useEffect, useState } from 'react';
import './MedicalRecommendationForm.css'; // Import the CSS file for this component
import { apiUrl } from './temp';
import Autocomplete from '@mui/material/Autocomplete';
import { TextField, CircularProgress, Box, Button } from '@mui/material';
import toast from "react-hot-toast";
import { MapContainer, Marker, Popup, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
});

const MedicalRecommendationForm = () => {
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [medicalQuantity, setMedicalQuantity] = useState(0);
  const [medicineSelectedName, setMedicineSelectedName] = useState('');
  const [storeRating, setStoreRating] = useState(0);
  const [nearestStores, setNearestStores] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [circularLoading, setCircularLoading] = useState(false);
  const [medicineSelected, setMedicineSelected] = useState("");
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [inputData, setInputData] = useState("");
  const [paths, setPaths] = useState([]);
  let debounceTimer;


  useEffect(() => {
    if (nearestStores.length > 0) {
      calculatePaths();
    }
  }, [nearestStores]);

  const calculatePaths = () => {
    const paths = nearestStores.map(store => {
      return [
        [latitude, longitude],
        [store.pharmacyId.latitude, store.pharmacyId.longitude]
      ];
    });
    setPaths(paths);
  };

  const handleIncrement = (setter) => () => setter(prev => prev + 1);
  const handleDecrement = (setter) => () => setter(prev => Math.max(0, prev - 1));

  const fetchMedicines = async (name) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/medicine/get/search?name=${name}`);
        if (response.ok) {
          const { data } = await response.json();
          setOptions(data);
        } else if (response.status === 404) {
          setOptions([]);
        } else if (response.status === 400) {
          setOptions([]);
        } else {
          toast.error("Failed to fetch medicines");
        }
      } catch (error) {
        console.error("Error fetching medicines:", error);
        toast.error("Error fetching medicines");
      }
      setLoading(false);
    }, 500); // Adjust the debounce delay as needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (medicalQuantity === 0 || longitude === 0 || latitude === 0 || medicineSelected === '') {
        toast.error("All fields are required to be filled")
      }
      else {
        setCircularLoading(true)
        const form = {
          latitude: `${latitude}`,
          longitude: `${longitude}`,
          medicineQuantity: `${medicalQuantity}`,
          medicineId: medicineSelected,
        };

        const response = await fetch(`${apiUrl}/user/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        const data = await response.json();
        setNearestStores(data.data);
        toast.success("Results are fetched successfully...")
        setCircularLoading(false)
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setCenter({ lat: latitude, lng: longitude });
        setInputData((prevData) => ({
          ...prevData,
          longitude: longitude.toString(),
          latitude: latitude.toString(),
        }));
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const formContainerStyle = {
    width: '100%', // Adjust this value as needed
    margin: '15px' // Center the form horizontally
  };

  const inputGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px', // Space between button and input
    width: '100%' // Ensure the input group takes full width
  };

  const inputStyle = {
    flexGrow: 1, // Make the input take the remaining space
    width: '100%', // Ensure the input takes full width within flex-grow
    padding: '10px', // Adjust padding as needed
    fontSize: '16px' // Adjust font size as needed
  };

  const inputFieldStyle = {
    width: '100%',
    marginBottom: '20px' // Space between fields
  };


  return (
    <div className="form-wrapper">
      <div className="form-container" style={formContainerStyle}>
        <form onSubmit={handleSubmit}>
          <div className="input-field" style={inputFieldStyle}>
            <label htmlFor="medicineName">Medicine Name:</label>
            <Autocomplete
              id="medicineName"
              options={options}
              getOptionLabel={(option) => option.medicineName}
              onInputChange={(event, value) => fetchMedicines(value)}
              onChange={(event, newValue) => {
                setMedicineSelected(newValue?._id || "")
                setMedicineSelectedName(newValue?.medicineName || "")
              }}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </div>
          <label>
            Latitude:
            <div style={inputGroupStyle}>
              <button type="button" onClick={handleDecrement(setLatitude)}>-</button>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                style={inputStyle}
              />
              <button type="button" onClick={handleIncrement(setLatitude)}>+</button>
            </div>
          </label>
          <label>
            Longitude:
            <div style={inputGroupStyle}>
              <button type="button" onClick={handleDecrement(setLongitude)}>-</button>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                style={inputStyle}
              />
              <button type="button" onClick={handleIncrement(setLongitude)}>+</button>
            </div>
          </label>
          <Box mb={1} mt={2} width={"50%"} justifyContent={"center"}>
            <Button
              variant="contained"
              sx={{ bgcolor: "green", "&:hover": { bgcolor: "darkgreen" } }}
              onClick={handleGetLocation}
              fullWidth
            >
              Get Location
            </Button>
          </Box>
          <label>
            Medicine Quantity:
            <div style={inputGroupStyle}>
              <button type="button" onClick={handleDecrement(setMedicalQuantity)}>-</button>
              <input
                type="number"
                value={medicalQuantity}
                onChange={(e) => setMedicalQuantity(parseInt(e.target.value, 10))}
                style={inputStyle}
              />
              <button type="button" onClick={handleIncrement(setMedicalQuantity)}>+</button>
            </div>
          </label>
          <button type="submit">Predict</button>
        </form>
      </div>
      <div className="heading-container">
        <h1>NearestPharma Recommendation System</h1>
        <h2>User Input Parameters</h2>
        <table>
          <thead>
            <tr>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Medicine Quantity</th>
              <th>Medicine Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{latitude}</td>
              <td>{longitude}</td>
              <td>{medicalQuantity}</td>
              <td>{medicineSelectedName}</td>
            </tr>
          </tbody>
        </table>
        <h2>Result of Nearest Pharmacies</h2>
        {circularLoading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>

            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Medicine Name</th>
                  <th>Medicine Qty</th>
                  <th>Rating</th>
                  <th>Area Name</th>
                  <th>Address</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {nearestStores.map(store => (
                  <tr key={store.id}>
                    <td>{store.pharmacyId.branchName}</td>
                    <td>{medicineSelectedName}</td>
                    <td>{store.medicineQuantity}</td>
                    <td>{store.pharmacyId.rating}</td>
                    <td>{store.pharmacyId.areaName}</td>
                    <td>{store.pharmacyId.address}</td>
                    <td>{store.pharmacyId.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2>Map to Show Locations</h2>
            <p><b>NOTE:</b> To show to map properly click your location once before predicting the results</p>
            <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom={true} style={{ height: "400px", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[center.lat, center.lng]}>
                <Popup autoOpen={true}>
                  Your location
                </Popup>
              </Marker>
              {nearestStores.map(store => (
                <Marker key={store._id} position={[store.pharmacyId.latitude, store.pharmacyId.longitude]}>
                  <Popup>
                    {store.pharmacyId.branchName}
                  </Popup>
                </Marker>
              ))}
              {paths.map((path, index) => (
                <Polyline key={index} pathOptions={{ color: 'blue' }} positions={path} />
              ))}
            </MapContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default MedicalRecommendationForm;
