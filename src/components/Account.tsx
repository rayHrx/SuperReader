'use client';

import React, { useEffect, useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  BookOpenCheck,
  User,
  Mail,
  Calendar,
  Chrome,
  CreditCard,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { auth, db, functions } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

interface Price {
  id: string;
  currency: string;
  unit_amount: number;
  interval?: string;
  type?: string;
  recurring?: {
    usage_type?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  prices: Price[];
}

interface Subscription {
  status: string;
  current_period_end: number;
  price: {
    get: () => Promise<{ data: () => Price }>;
  };
}

export default function Account() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: Price }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState<string>("");

  useEffect(() => {
    if (!user) {
      console.log("No user found, skipping subscription and product fetch");
      return;
    }

    console.log("Starting subscription listener for user:", user.uid);

    // Listen to subscriptions
    const subscriptionsRef = collection(
      db,
      "customers",
      user.uid,
      "subscriptions"
    );
    console.log("Subscription path:", `customers/${user.uid}/subscriptions`);

    const q = query(
      subscriptionsRef,
      where("status", "in", ["trialing", "active"])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Subscription snapshot received:", {
          empty: snapshot.empty,
          size: snapshot.size,
          docs: snapshot.docs.map((d) => d.id),
        });

        const subs = snapshot.docs.map((doc) => doc.data() as Subscription);
        console.log("Parsed subscriptions:", subs);
        setSubscriptions(subs);
        setLoading(false);
      },
      (error) => {
        console.error("Subscription listener error:", {
          code: error.code,
          message: error.message,
          details: error,
        });
        setLoading(false);
      }
    );

    // Fetch products and prices
    const fetchProducts = async () => {
      try {
        console.log("Starting products fetch");
        const productsRef = collection(db, "products");
        const productsQuery = query(productsRef, where("active", "==", true));

        console.log("Fetching products...");
        const querySnapshot = await getDocs(productsQuery);
        console.log("Products snapshot received:", {
          empty: querySnapshot.empty,
          size: querySnapshot.size,
          docs: querySnapshot.docs.map((d) => ({
            id: d.id,
            exists: d.exists(),
            data: d.data(),
          })),
        });

        const productsData: Product[] = [];
        const pricesData: { [key: string]: Price } = {};

        for (const doc of querySnapshot.docs) {
          console.log("Processing product:", doc.id);
          const product = doc.data();

          console.log("Fetching prices for product:", doc.id);
          const priceSnap = await getDocs(
            query(collection(doc.ref, "prices"), where("active", "==", true))
          );

          console.log("Prices snapshot for product", doc.id, ":", {
            empty: priceSnap.empty,
            size: priceSnap.size,
            prices: priceSnap.docs.map((p) => ({
              id: p.id,
              data: p.data(),
            })),
          });

          const prices = priceSnap.docs.map(
            (price) =>
              ({
                id: price.id,
                ...price.data(),
              } as Price)
          );

          prices.forEach((price) => {
            pricesData[price.id] = price;
          });

          productsData.push({
            id: doc.id,
            ...product,
            prices,
          } as Product);
        }

        console.log("Final processed data:", {
          products: productsData,
          prices: pricesData,
        });

        setProducts(productsData);
        setPrices(pricesData);
      } catch (error: any) {
        console.error("Error fetching products:", {
          code: error.code,
          message: error.message,
          details: error,
        });

        // Additional debugging for specific error types
        if (error.code === "permission-denied") {
          console.log("Permission denied. Current security rules:", {
            path: error.path,
            requiredAccess: error.requiredAccess,
          });
        }
      }
    };

    fetchProducts();
    return () => {
      console.log("Cleaning up subscription listener");
      unsubscribe();
    };
  }, [user]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) return;

    const checkoutSession = {
      automatic_tax: true,
      tax_id_collection: true,
      collect_shipping_address: true,
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: window.location.origin,
      cancel_url: window.location.origin,
    };

    const sessionsRef = collection(
      db,
      "customers",
      user.uid,
      "checkout_sessions"
    );
    const docRef = await addDoc(sessionsRef, checkoutSession);

    // Wait for the CheckoutSession to get attached
    onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as any;
      if (error) {
        alert(`An error occurred: ${error.message}`);
      }
      if (url) {
        window.location.assign(url);
      }
    });
  };

  const handleBillingPortal = async () => {
    const createPortalLink = httpsCallable(
      functions,
      "ext-firestore-stripe-subscriptions-createPortalLink"
    );
    const { data } = await createPortalLink({
      returnUrl: window.location.origin,
    });
    window.location.assign((data as any).url);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    router.push("/welcome");
    return null;
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-900 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Profile"}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.displayName || "Anonymous User"}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Member since{" "}
                    {new Date(user.metadata.creationTime!).toLocaleDateString()}
                  </span>
                </div>
                {user.providerData[0].providerId === "google.com" && (
                  <div className="flex items-center gap-2">
                    <Chrome className="w-4 h-4" />
                    <span>Google Account</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Subscription Status Card */}
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Status
              </h2>

              {loading ? (
                <div className="text-gray-400">
                  Loading subscription details...
                </div>
              ) : subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {subscriptions.map((sub, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-300">Current Plan</p>
                        <p className="text-white font-medium">{sub.status}</p>
                        <p className="text-sm text-gray-400">
                          Next billing date:{" "}
                          {new Date(
                            sub.current_period_end * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={handleBillingPortal}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Manage Subscription
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 mb-4">
                      Choose a subscription plan:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="p-4 border border-gray-600 rounded-lg"
                        >
                          <h3 className="text-white font-medium mb-2">
                            {product.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            {product.description}
                          </p>
                          <select
                            className="w-full p-2 bg-gray-600 text-white rounded-lg mb-4"
                            onChange={(e) => setSelectedPrice(e.target.value)}
                          >
                            <option value="">Select a plan</option>
                            {product.prices.map((price: any) => (
                              <option key={price.id} value={price.id}>
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: price.currency,
                                }).format(price.unit_amount / 100)}{" "}
                                / {price.interval || "one-time"}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSubscribe(selectedPrice)}
                            disabled={!selectedPrice}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-500"
                          >
                            Subscribe
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-2">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-300">
                    Last login: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-600 transition-colors">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Account Settings</span>
                </button>
                <button className="w-full bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-600 transition-colors">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Notifications</span>
                </button>
                <button className="w-full bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-600 transition-colors">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Help & Support</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 text-red-400 rounded-lg p-4 flex items-center gap-3 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}