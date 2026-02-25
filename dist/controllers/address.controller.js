"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressController = void 0;
const user_model_1 = require("../models/user.model");
class AddressController {
    // Get all addresses
    async getAddresses(req, res, next) {
        try {
            const userId = req.user._id;
            const user = await user_model_1.User.findById(userId).select("addresses");
            res.json({
                success: true,
                data: user?.addresses || [],
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Add new address
    async addAddress(req, res, next) {
        try {
            const userId = req.user._id;
            const addressData = req.body;
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // If this is the first address or marked as default, update others
            if (addressData.isDefault || user.addresses.length === 0) {
                user.addresses.forEach((addr) => {
                    addr.isDefault = false;
                });
                addressData.isDefault = true;
            }
            user.addresses.push(addressData);
            await user.save();
            // Get the newly added address (last one)
            const newAddress = user.addresses[user.addresses.length - 1];
            res.status(201).json({
                success: true,
                message: "Address added successfully",
                data: newAddress,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Update address - USING THE MODEL METHOD
    async updateAddress(req, res, next) {
        try {
            const userId = req.user._id;
            const { addressId } = req.params;
            const updates = req.body;
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Use the model method to find address by ID
            const addressIndex = user.getAddressIndex(addressId);
            if (addressIndex === -1) {
                return res.status(404).json({ message: "Address not found" });
            }
            // Handle default address logic
            if (updates.isDefault) {
                user.addresses.forEach((addr) => {
                    addr.isDefault = false;
                });
            }
            // Update address fields
            const addressToUpdate = user.addresses[addressIndex];
            Object.keys(updates).forEach((key) => {
                if (key !== "_id") {
                    addressToUpdate[key] = updates[key];
                }
            });
            await user.save();
            res.json({
                success: true,
                message: "Address updated successfully",
                data: user.addresses[addressIndex],
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete address - USING THE MODEL METHOD
    async deleteAddress(req, res, next) {
        try {
            const userId = req.user._id;
            const { addressId } = req.params;
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Use the model method to find address by ID
            const addressToDelete = user.getAddressById(addressId);
            if (!addressToDelete) {
                return res.status(404).json({ message: "Address not found" });
            }
            // Check if it was the default address
            const wasDefault = addressToDelete.isDefault;
            // Filter out the address
            user.addresses = user.addresses.filter((addr) => !(addr._id && addr._id.toString() === addressId));
            // If we deleted the default address and there are other addresses,
            // make the first one default
            if (wasDefault && user.addresses.length > 0) {
                user.addresses[0].isDefault = true;
            }
            await user.save();
            res.json({
                success: true,
                message: "Address deleted successfully",
                data: user.addresses,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Set default address - USING THE MODEL METHOD
    async setDefaultAddress(req, res, next) {
        try {
            const userId = req.user._id;
            const { addressId } = req.params;
            const user = await user_model_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Use the model method to check if address exists
            const addressExists = user.getAddressById(addressId);
            if (!addressExists) {
                return res.status(404).json({ message: "Address not found" });
            }
            // Set all to false, then set selected to true
            user.addresses.forEach((addr) => {
                addr.isDefault = false;
            });
            // Find and update the default address using the index method
            const addressIndex = user.getAddressIndex(addressId);
            if (addressIndex !== -1) {
                user.addresses[addressIndex].isDefault = true;
            }
            await user.save();
            res.json({
                success: true,
                message: "Default address updated",
                data: user.addresses,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AddressController = AddressController;
