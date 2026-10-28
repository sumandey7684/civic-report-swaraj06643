import React, { useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Search, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MapExplorer = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');

  // Bhubaneswar coordinates and ward data
  const bhubaneswarCenter: [number, number] = [85.8245, 20.2961];
  
  // Sample ward data for Bhubaneswar
  const wards = [
    { id: 1, name: "Ward 1 - Saheed Nagar", issues: 12, lat: 20.3019, lng: 85.8449 },
    { id: 2, name: "Ward 2 - Jayadev Vihar", issues: 8, lat: 20.2906, lng: 85.8243 },
    { id: 3, name: "Ward 3 - Khandagiri", issues: 15, lat: 20.2542, lng: 85.7785 },
    { id: 4, name: "Ward 4 - Patia", issues: 6, lat: 20.3497, lng: 85.8181 },
    { id: 5, name: "Ward 5 - Chandrasekharpur", issues: 10, lat: 20.3176, lng: 85.8048 },
    { id: 6, name: "Ward 6 - Old Town", issues: 18, lat: 20.2394, lng: 85.8336 },
    { id: 7, name: "Ward 7 - Unit-8", issues: 7, lat: 20.2625, lng: 85.8354 },
    { id: 8, name: "Ward 8 - Kalinga Nagar", issues: 9, lat: 20.2847, lng: 85.7784 }
  ];

  const visibleWards = wards.filter((ward) => {
    const matchesSearch = ward.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'high' ? ward.issues >= 12 : ward.issues < 12);
    return matchesSearch && matchesFilter;
  });

  const wardIcon = new L.DivIcon({
    className: 'ward-marker',
    html: '<span style="display:block;width:24px;height:24px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 2px 6px #0005"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-4 mb-6"
            >
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="btn-framer-ghost"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4">
                Bhubaneswar Map Ward wise
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Explore civic issues across Bhubaneswar municipality ward-wise. 
                Click on ward markers to view active issues and report new ones.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Search and Filters */}
              <div className="glass-effect p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ward name or area..."
                      className="pl-10"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All Wards</Button>
                    <Button variant={filter === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('high')}>High Issues</Button>
                    <Button variant={filter === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('low')}>Low Issues</Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border shadow-2xl">
                <MapContainer center={[20.2961, 85.8245]} zoom={11} className="w-full h-[600px]">
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {visibleWards.map((ward) => (
                    <Marker key={ward.id} position={[ward.lat, ward.lng]} icon={wardIcon}>
                      <Popup><strong>{ward.name}</strong><br />Active Issues: {ward.issues}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Ward Summary */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleWards.map((ward, index) => (
                  <motion.div
                    key={ward.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="glass-effect p-6 rounded-2xl hover:shadow-[var(--shadow-elevated)] transition-all duration-300"
                  >
                    <h3 className="font-bold text-lg mb-2">{ward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Active Issues: <span className="font-semibold text-destructive">{ward.issues}</span>
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default MapExplorer;
