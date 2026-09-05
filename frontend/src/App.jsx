import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("Retailer");
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const [selectedRider, setSelectedRider] = useState({});

  // =========================
  // FETCH DELIVERIES
  // =========================

  const fetchDeliveries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/deliveries`);
      const data = await response.json();

      setDeliveries(data);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  };

  // =========================
  // FETCH RIDERS
  // =========================

  const fetchRiders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/riders`);
      const data = await response.json();

      setRiders(data);
    } catch (error) {
      console.error("Error fetching riders:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDeliveries();

      if (role === "Dispatcher") {
        fetchRiders();
      }
    }
  }, [isLoggedIn, role]);

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid email or password.");
        return;
      }

      setUser(data.user);
      setRole(data.user.role);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login error:", error);

      alert("Could not connect to Reflex server.");
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setEmail("");
    setPassword("");
    setRole("Retailer");
    setSelectedRider({});
  };

  // =========================
  // CREATE DELIVERY
  // =========================

  const createDelivery = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: address,
          item_description: itemDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create delivery");
      }

      setCustomerName("");
      setCustomerPhone("");
      setAddress("");
      setItemDescription("");

      fetchDeliveries();

      alert("Delivery created successfully.");
    } catch (error) {
      console.error("Error creating delivery:", error);

      alert("Could not create delivery.");
    }
  };

  // =========================
  // ASSIGN RIDER
  // =========================

  const assignRider = async (id) => {
    const riderId = selectedRider[id];

    if (!riderId) {
      alert("Please select a rider first.");
      return;
    }

    const rider = riders.find(
      (rider) => String(rider.id) === String(riderId)
    );

    if (!rider) {
      alert("Selected rider could not be found.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/deliveries/${id}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rider_id: rider.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not assign rider.");
        return;
      }

      setSelectedRider((previous) => ({
        ...previous,
        [id]: "",
      }));

      fetchDeliveries();

      alert(`Delivery assigned to ${rider.name}.`);
    } catch (error) {
      console.error("Error assigning rider:", error);

      alert("Could not assign rider.");
    }
  };

  // =========================
  // PICK UP DELIVERY
  // =========================

  const pickupDelivery = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/deliveries/${id}/pickup`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update delivery");
      }

      fetchDeliveries();
    } catch (error) {
      console.error("Error picking up delivery:", error);

      alert("Could not update delivery.");
    }
  };

  // =========================
  // DELIVER DELIVERY
  // =========================

  const deliverDelivery = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/deliveries/${id}/deliver`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete delivery");
      }

      fetchDeliveries();
    } catch (error) {
      console.error("Error completing delivery:", error);

      alert("Could not complete delivery.");
    }
  };

  // =========================
  // DELIVERY COUNTS
  // =========================

  const pendingCount = deliveries.filter(
    (delivery) => delivery.status === "Pending"
  ).length;

  const activeCount = deliveries.filter(
    (delivery) =>
      delivery.status === "Assigned" ||
      delivery.status === "Picked Up"
  ).length;

  const deliveredCount = deliveries.filter(
    (delivery) => delivery.status === "Delivered"
  ).length;

  const assignedCount = deliveries.filter(
    (delivery) => delivery.status === "Assigned"
  ).length;

  const pickedUpCount = deliveries.filter(
    (delivery) => delivery.status === "Picked Up"
  ).length;

  // =========================
  // LOGIN PAGE
  // =========================

  if (!isLoggedIn) {
    return (
      <div className="login-page">

        <div className="login-visual">

          <div className="login-brand">
            <span className="logo-mark">R</span>
            <span>Reflex</span>
          </div>

          <div className="login-visual-content">

            <span className="eyebrow">
              SMART DELIVERY MANAGEMENT
            </span>

            <h1>
              Every delivery.
              <span> Under control.</span>
            </h1>

            <p>
              Reflex connects retailers, dispatchers and riders in one simple
              delivery management platform.
            </p>

            <div className="login-delivery-card">

              <div className="delivery-icon">
                📦
              </div>

              <div>
                <strong>
                  Delivery #1045
                </strong>

                <span>
                  On the way to Westlands
                </span>
              </div>

              <div className="login-status">
                ● Live
              </div>

            </div>

          </div>

        </div>

        <div className="login-panel">

          <div className="login-box">

            <div className="mobile-logo">

              <span className="logo-mark">
                R
              </span>

              <span>
                Reflex
              </span>

            </div>

            <span className="small-label">
              WELCOME BACK
            </span>

            <h2>
              Sign in to Reflex
            </h2>

            <p className="login-description">
              Access your delivery dashboard and stay on top of every order.
            </p>

            <form onSubmit={handleLogin}>

              <label>
                Email address

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </label>

              <label>
                Password

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </label>

              <button
                type="submit"
                className="login-submit"
              >
                Sign in →
              </button>

            </form>

            <p className="login-demo">
              Use your Reflex account credentials to sign in.
            </p>

          </div>

        </div>

      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">

          <span className="logo-mark">
            R
          </span>

          <span>
            Reflex
          </span>

        </div>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#deliveries">
            Deliveries
          </a>

          <a href="#how-it-works">
            How it works
          </a>

        </div>

        <div className="nav-user">

          <span>
            {user?.name} · {role}
          </span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>

        </div>

      </nav>

      {/* HERO */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <span className="eyebrow">
            {role.toUpperCase()} DASHBOARD
          </span>

          <h1>
            Deliveries made
            <span> simple.</span>
          </h1>

          <p>
            Manage every delivery from request to doorstep in one simple
            platform. Reflex helps retailers, dispatchers and riders stay
            organized and connected.
          </p>

          <div className="hero-buttons">

            {role === "Retailer" && (
              <a
                href="#create-delivery"
                className="primary-button"
              >
                Create a delivery
              </a>
            )}

            {role === "Dispatcher" && (
              <a
                href="#deliveries"
                className="primary-button"
              >
                Manage deliveries
              </a>
            )}

            {role === "Rider" && (
              <a
                href="#deliveries"
                className="primary-button"
              >
                View my deliveries
              </a>
            )}

            <a
              href="#deliveries"
              className="secondary-button"
            >
              View deliveries →
            </a>

          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-image-card">

            <div className="delivery-illustration">

              <div className="package">
                📦
              </div>

              <div className="route-line"></div>

              <div className="location-pin">
                📍
              </div>

            </div>

            <div className="floating-card top-card">

              <span className="status-dot"></span>

              Delivery on the way

            </div>

            <div className="floating-card bottom-card">

              <strong>
                Live
              </strong>

              <span>
                delivery tracking
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* STATS */}

      <section className="stats">

        <div>
          <strong>
            {deliveries.length}
          </strong>

          <span>
            Total deliveries
          </span>
        </div>

        <div>
          <strong>
            {activeCount}
          </strong>

          <span>
            Active deliveries
          </span>
        </div>

        <div>
          <strong>
            {deliveredCount}
          </strong>

          <span>
            Delivered
          </span>
        </div>

        <div>
          <strong>
            {pendingCount}
          </strong>

          <span>
            Waiting for assignment
          </span>
        </div>

      </section>

      {/* HOW REFLEX WORKS */}

      <section
        className="features"
        id="how-it-works"
      >

        <div className="section-heading">

          <span className="eyebrow">
            HOW REFLEX WORKS
          </span>

          <h2>
            Everything your delivery team needs.
          </h2>

          <p>
            From the moment an order is created to the moment it reaches the
            customer.
          </p>

        </div>

        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              ＋
            </div>

            <h3>
              Create
            </h3>

            <p>
              Retailers log delivery requests with customer, address and item
              details.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ↗
            </div>

            <h3>
              Assign
            </h3>

            <p>
              Dispatchers quickly assign delivery requests to available riders.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ✓
            </div>

            <h3>
              Track
            </h3>

            <p>
              Riders update delivery status while retailers see the latest
              progress.
            </p>

          </div>

        </div>

      </section>

      {/* DASHBOARD */}

      <main id="deliveries">

        {/* RETAILER */}

        {role === "Retailer" && (

          <section
            className="card create-card"
            id="create-delivery"
          >

            <div className="card-heading">

              <div>

                <span className="small-label">
                  RETAILER
                </span>

                <h2>
                  Create Delivery
                </h2>

              </div>

              <div className="heading-icon">
                +
              </div>

            </div>

            <form onSubmit={createDelivery}>

              <label>
                Customer name

                <input
                  type="text"
                  placeholder="e.g. Mary Achieng"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Phone number

                <input
                  type="text"
                  placeholder="e.g. 0724575959"
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Delivery address

                <input
                  type="text"
                  placeholder="e.g. Westlands, Nairobi"
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Item description

                <input
                  type="text"
                  placeholder="e.g. Laptop Charger"
                  value={itemDescription}
                  onChange={(e) =>
                    setItemDescription(e.target.value)
                  }
                  required
                />
              </label>

              <button
                type="submit"
                className="create-button"
              >
                Create delivery
              </button>

            </form>

          </section>

        )}

        {/* DISPATCHER */}

        {role === "Dispatcher" && (

          <section className="card create-card">

            <div className="card-heading">

              <div>

                <span className="small-label">
                  DISPATCHER
                </span>

                <h2>
                  Dispatch Centre
                </h2>

              </div>

              <div className="heading-icon">
                ↗
              </div>

            </div>

            <p className="role-description">
              Review pending delivery requests and assign them to riders.
            </p>

            <div className="dispatcher-summary">

              <div>

                <strong>
                  {pendingCount}
                </strong>

                <span>
                  Pending
                </span>

              </div>

              <div>

                <strong>
                  {activeCount}
                </strong>

                <span>
                  Active
                </span>

              </div>

              <div>

                <strong>
                  {deliveredCount}
                </strong>

                <span>
                  Completed
                </span>

              </div>

            </div>

          </section>

        )}

        {/* RIDER */}

        {role === "Rider" && (

          <section className="card create-card">

            <div className="card-heading">

              <div>

                <span className="small-label">
                  RIDER
                </span>

                <h2>
                  My Deliveries
                </h2>

              </div>

              <div className="heading-icon">
                🛵
              </div>

            </div>

            <p className="role-description">
              View assigned deliveries and update their progress.
            </p>

            <div className="dispatcher-summary">

              <div>

                <strong>
                  {assignedCount}
                </strong>

                <span>
                  Assigned
                </span>

              </div>

              <div>

                <strong>
                  {pickedUpCount}
                </strong>

                <span>
                  Picked Up
                </span>

              </div>

              <div>

                <strong>
                  {deliveredCount}
                </strong>

                <span>
                  Completed
                </span>

              </div>

            </div>

          </section>

        )}

        {/* DELIVERY LIST */}

        <section className="card deliveries-card">

          <div className="card-heading">

            <div>

              <span className="small-label">
                LIVE OVERVIEW
              </span>

              <h2>
                {role === "Retailer"
                  ? "Your Deliveries"
                  : role === "Dispatcher"
                  ? "Delivery Requests"
                  : "Assigned Deliveries"}
              </h2>

            </div>

            <span className="delivery-count">
              {deliveries.length} total
            </span>

          </div>

          {deliveries.length === 0 ? (

            <div className="empty-state">

              <div>
                📦
              </div>

              <p>
                No deliveries yet.
              </p>

            </div>

          ) : (

            <div className="delivery-list">

              {deliveries.map((delivery) => (

                <div
                  className="delivery"
                  key={delivery.id}
                >

                  <div className="delivery-top">

                    <div>

                      <span className="delivery-number">
                        DELIVERY #{delivery.id}
                      </span>

                      <h3>
                        {delivery.customer_name}
                      </h3>

                    </div>

                    <span
                      className={`status status-${delivery.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {delivery.status}
                    </span>

                  </div>

                  <div className="delivery-details">

                    <div>

                      <span>
                        Phone
                      </span>

                      <strong>
                        {delivery.customer_phone}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Address
                      </span>

                      <strong>
                        {delivery.delivery_address}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Item
                      </span>

                      <strong>
                        {delivery.item_description}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Rider
                      </span>

                      <strong>
                        {delivery.rider_name || "Not assigned"}
                      </strong>

                    </div>

                  </div>

                  {/* DISPATCHER ACTION */}

                  {role === "Dispatcher" &&
                    delivery.status === "Pending" && (

                    <div className="actions">

                      <select
                        value={selectedRider[delivery.id] || ""}
                        onChange={(e) =>
                          setSelectedRider((previous) => ({
                            ...previous,
                            [delivery.id]: e.target.value,
                          }))
                        }
                      >

                        <option value="">
                          Select a rider
                        </option>

                        {riders.map((rider) => (

                          <option
                            key={rider.id}
                            value={rider.id}
                          >
                            {rider.name}
                          </option>

                        ))}

                      </select>

                      <button
                        onClick={() =>
                          assignRider(delivery.id)
                        }
                      >
                        Assign Rider
                      </button>

                    </div>

                  )}

                  {/* RIDER PICKUP */}

                  {role === "Rider" &&
                    delivery.status === "Assigned" && (

                    <div className="actions">

                      <button
                        onClick={() =>
                          pickupDelivery(delivery.id)
                        }
                      >
                        Mark Picked Up
                      </button>

                    </div>

                  )}

                  {/* RIDER DELIVER */}

                  {role === "Rider" &&
                    delivery.status === "Picked Up" && (

                    <div className="actions">

                      <button
                        onClick={() =>
                          deliverDelivery(delivery.id)
                        }
                      >
                        Mark Delivered
                      </button>

                    </div>

                  )}

                  {/* RETAILER STATUS */}

                  {role === "Retailer" &&
                    delivery.status !== "Delivered" && (

                    <div className="retailer-status">

                      Delivery is currently{" "}

                      <strong>
                        {delivery.status}
                      </strong>

                    </div>

                  )}

                  {/* COMPLETED */}

                  {delivery.status === "Delivered" && (

                    <span className="completed-message">
                      ✓ Delivery completed
                    </span>

                  )}

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

      {/* FOOTER */}

      <footer>

        <div className="footer-brand">

          <div className="logo">

            <span className="logo-mark">
              R
            </span>

            <span>
              Reflex
            </span>

          </div>

          <p>
            Simple delivery management for Kenyan retailers.
          </p>

        </div>

        <div className="footer-contact">

          <h3>
            Contact us
          </h3>

          <p>
            📧 info@reflex.co.ke
          </p>

          <p>
            📞 +254 700 464 786
          </p>

          <p>
            📍 Nairobi, Kenya
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;