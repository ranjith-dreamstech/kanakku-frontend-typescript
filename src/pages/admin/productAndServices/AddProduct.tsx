import type { FC } from 'react';
import ProductForm from "../../admin/productAndServices/ProductForm";

const AddProduct: FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Add New Product
            </h1>
            <ProductForm />
        </div>
    );
}

export default AddProduct;