import React from "react";
import { Pagination } from "@mui/material";
import type { PaginationProps } from "@mui/material";

interface PaginationWrapperProps extends Omit<PaginationProps, 'onChange'> {
    page: number;
    count: number;
    from: number;
    to: number;
    total: number;
    onChange: (event: React.ChangeEvent<unknown>, page: number) => void;
    paginationVariant?: any;
    paginationShape?: 'rounded' | 'circular';
}

const PaginationWrapper: React.FC<PaginationWrapperProps> = ({
    page,
    count,
    from,
    to,
    total,
    onChange,
    paginationVariant,
    paginationShape,
    ...rest
}) => {
    return (
        <div className="flex justify-between items-center mt-4">
            <p className="text-gray-800 dark:text-white text-sm font-medium">
                Showing {total > 0 ? from : 0} to {to} of {total} entries
            </p>

            <Pagination
                  count={count}
                  page={page}
                  onChange={onChange}
                  variant={paginationVariant || 'outlined'}
                  shape={paginationShape || 'rounded'}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#8b5cf6',
                      fontWeight: 'medium',
                    },
                    '& .MuiPaginationItem-page.Mui-selected': {
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#7c3aed',
                      },
                    },
                    '& .MuiPaginationItem-page:hover': {
                      backgroundColor: '#ede9fe',
                    },
                  }}
                />
        </div>
    );
};

export default PaginationWrapper;
